<script lang="ts">
export default {
  name: 'user',
};
</script>

<script lang="ts" setup>
import {
  reactive,
  ref,
  watchEffect,
  onMounted,
  getCurrentInstance,
  toRefs,
} from 'vue';
import {useI18n} from 'vue-i18n';

// api
import {
  listUserPages,
  getUserForm,
  deleteUsers,
  addUser,
  updateUser,
  updateUserStatus,
  updateUserPassword,
  downloadTemplate,
  exportUser,
  importUser,
} from '@/api/system/user';
import {listDeptOptions} from '@/api/system/dept';
import {listRoleOptions} from '@/api/system/role';

import {
  ElTree,
  ElForm,
  UploadFile,
} from 'element-plus';
import {
  Search,
  Plus,
  Refresh,
  Delete,
  Download,
  Top,
  UploadFilled,
} from '@element-plus/icons-vue';
import {
  UserForm,
  UserImportData,
  UserQuery,
  UserType,
} from '@/api/system/user/types';

const deptTreeRef = ref(ElTree); // 部门树
const queryFormRef = ref(ElForm); // 查询表单
const dataFormRef = ref(ElForm); // 用户表单
const importFormRef = ref(ElForm); // 导入表单

const {proxy}: any = getCurrentInstance();
const {t} = useI18n();

const state = reactive({
  // 遮罩层
  loading: true,
  // 选中数组
  ids: [] as number[],
  // 总条数
  total: 0,
  userList: [] as UserType[],
  dialog: {
    visible: false,
  } as DialogType,
  deptName: undefined,
  // 部门下拉项
  deptOptions: [] as OptionType[],
  // 性别下拉项
  genderOptions: [] as OptionType[],
  // 角色下拉项
  roleOptions: [] as OptionType[],
  formData: {
    status: 1,
  } as UserForm,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
  } as UserQuery,
  rules: {
    username: [{required: true, message: t('system.user.usernameRequired'), trigger: 'blur'}],
    nickname: [
      {required: true, message: t('system.user.nicknameRequired'), trigger: 'blur'},
    ],
    deptId: [{required: true, message: t('system.user.deptRequired'), trigger: 'blur'}],
    roleIds: [{required: true, message: t('system.user.roleRequired'), trigger: 'blur'}],
    email: [
      {
        pattern: /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/,
        message: t('system.user.emailInvalid'),
        trigger: 'blur',
      },
    ],
    mobile: [
      {
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: t('system.user.mobileInvalid'),
        trigger: 'blur',
      },
    ],
  },

  importDialog: {
    title: t('system.user.importTitle'),
    visible: false,
  } as DialogType,
  importFormData: {} as UserImportData,
  excelFile: undefined as any,
  excelFilelist: [] as File[],
});

const {
  ids,
  loading,
  queryParams,
  userList,
  total,
  dialog,
  formData,
  rules,
  deptName,
  deptOptions,
  roleOptions,
  importDialog,
  importFormData,
  excelFilelist,
} = toRefs(state);

watchEffect(
  () => {
    deptTreeRef.value.filter(state.deptName);
  },
  {
    flush: 'post', // watchEffect会在DOM挂载或者更新之前就会触发，此属性控制在DOM元素更新后运行
  }
);

/**
 * 部门筛选
 */
function filterDeptNode(value: string, data: any) {
  if (!value) {
    return true;
  }
  return data.label.indexOf(value) !== -1;
}

/**
 * 部门树节点click
 */
function handleDeptNodeClick(data: { [key: string]: any }) {
  state.queryParams.deptId = data.value;
  handleQuery();
}

/**
 * 获取角色下拉项
 */
async function getRoleOptions() {
  listRoleOptions().then((response) => {
    state.roleOptions = response.data;
  });
}

/**
 * 用户状态change
 */
function handleStatusChange(row: UserType) {
  const text = t(row.status === 1 ? 'common.enabled' : 'common.stop');
  const successText = t(
    row.status === 1 ? 'common.enabledSuccess' : 'common.disabledSuccess'
  );
  ElMessageBox.confirm(
    t('system.user.confirmStatusChange', {action: text, username: row.username}),
    t('common.warning'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }
  )
    .then(() => {
      return updateUserStatus(row.id, row.status);
    })
    .then(() => {
      ElMessage.success(successText);
    })
    .catch(() => {
      row.status = row.status === 1 ? 0 : 1;
    });
}

/**
 * 查询
 */
function handleQuery() {
  state.loading = true;
  listUserPages(state.queryParams)
    .then(({data}) => {
      state.userList = data.list;
      state.total = data.total;
    })
    .finally(() => {
      state.loading = false;
    });
}

/**
 * 重置
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

/**
 * 行选中
 */
function handleSelectionChange(selection: UserType[]) {
  state.ids = selection.map((item: UserType) => item.id);
}

/**
 * 重置密码
 */
function resetPassword(row: UserType) {
  ElMessageBox.prompt(
    t('system.user.resetPasswordPrompt', {username: row.username}),
    t('system.user.resetPassword'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
    }
  )
    .then(({value}) => {
      if (!value) {
        ElMessage.warning(t('system.user.newPasswordRequired'));
        return false;
      }
      updateUserPassword(row.id, value)
        .then(() => {
          ElMessage.success(t('system.user.passwordResetSuccess'));
        })
        .catch(() => {});
    })
    .catch(() => {
    });
}

/**
 * 添加用户
 **/
async function handleAdd() {
  // 重置表单，避免残留上次编辑的数据
  state.formData = {
    id: undefined,
    deptId: undefined,
    username: '',
    nickname: '',
    password: '',
    mobile: '',
    email: '',
    gender: 1,
    status: 1,
    remark: '',
    roleIds: [],
  } as any;
  state.dialog = {
    title: t('system.user.addUser'),
    visible: true,
  };
  await getDeptOptions();
  await getRoleOptions();
}

/**
 * 修改用户
 **/
async function handleUpdate(row: UserType) {
  dialog.value = {
    title: t('system.user.updateUser'),
    visible: true,
  };

  const userId = row.id;
  await getDeptOptions();
  await getRoleOptions();
  getUserForm(userId).then(({data}) => {
    formData.value = data;
  });
}

/**
 * 表单提交
 */
function submitForm() {
  dataFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const userId = state.formData.id;
      if (userId) {
        updateUser(userId, state.formData)
          .then(() => {
            ElMessage.success(t('system.user.updateUserSuccess'));
            closeDialog();
            handleQuery();
          })
          .catch(() => {});
      } else {
        addUser(state.formData)
          .then(() => {
            ElMessage.success(t('system.user.addUserSuccess'));
            closeDialog();
            handleQuery();
          })
          .catch(() => {});
      }
    }
  });
}

/**
 * 删除用户
 */
function handleDelete(row: UserType) {
  const userIds = row.id ? String(row.id) : state.ids.join(',');
  ElMessageBox.confirm(
    t('system.user.confirmDeleteUser', {ids: userIds}),
    t('common.warning'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    }
  )
    .then(function () {
      deleteUsers(userIds)
        .then(() => {
          ElMessage.success(t('common.deleteSuccess'));
          handleQuery();
        })
        .catch(() => {});
    })
    .catch(() => ElMessage.info(t('common.cancelledDelete')));
}

/**
 * 关闭用户弹窗
 */
function closeDialog() {
  dialog.value.visible = false;
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();
}

/**
 * 获取部门下拉项
 */
async function getDeptOptions() {
  listDeptOptions().then((response) => {
    state.deptOptions = response.data;
  });
}

/**
 * 获取性别下拉项
 */
function getGenderOptions() {
  proxy.$listDictItemsByTypeCode('gender').then((response: any) => {
    state.genderOptions = response?.data;
  });
}

/**
 * 从 Content-Disposition 响应头解析下载文件名
 */
function resolveFilename(disposition: string | undefined): string {
  if (!disposition) {
    return 'download';
  }
  // 优先解析 RFC 5987 的 filename*=UTF-8''xxx
  const starMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (starMatch) {
    return safeDecode(starMatch[1]);
  }
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match) {
    return safeDecode(match[1]);
  }
  return 'download';
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * 下载导入模板
 */
function handleDownloadTemplate() {
  downloadTemplate().then((response: any) => {
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
    });
    const a = document.createElement('a');
    const href = window.URL.createObjectURL(blob); // 下载链接
    a.href = href;
    a.download = resolveFilename(response.headers['content-disposition']);
    document.body.appendChild(a);
    a.click(); // 点击下载
    document.body.removeChild(a); // 下载完成移除元素
    window.URL.revokeObjectURL(href); // 释放掉blob对象
  }).catch(() => {});
}

/**
 * 导入弹窗
 */
async function showImportDialog() {
  await getDeptOptions();
  await getRoleOptions();
  importDialog.value.visible = true;
}

/**
 * Excel文件change事件
 *
 * @param file
 */
function handleExcelChange(file: UploadFile) {
  if (!/\.(xlsx|xls|XLSX|XLS)$/.test(file.name)) {
    ElMessage.warning(t('system.user.excelFormatInvalid'));
    state.excelFile = undefined;
    state.excelFilelist = [];
    return false;
  }
  state.excelFile = file.raw;
}

/**
 * Excel文件上传
 */
function submitImportForm() {
  importFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (!state.excelFile) {
        ElMessage.warning(t('system.user.excelRequired'));
        return false;
      }

      const deptId = state.importFormData.deptId;
      const roleIds = state.importFormData.roleIds.join(',');
      importUser(deptId, roleIds, state.excelFile)
        .then((response) => {
          ElMessage.success(response.data);
          closeImportDialog();
          handleQuery();
        })
        .catch(() => {});
    }
  });
}

/**
 * 关闭导入弹窗
 */
function closeImportDialog() {
  state.importDialog.visible = false;
  state.excelFile = undefined;
  state.excelFilelist = [];
  importFormRef.value.resetFields();
}

/**
 * 导出用户
 */
function handleExport() {
  exportUser(queryParams.value).then((response: any) => {
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
    });
    const a = document.createElement('a');
    const href = window.URL.createObjectURL(blob); // 下载的链接
    a.href = href;
    a.download = resolveFilename(response.headers['content-disposition']);
    document.body.appendChild(a);
    a.click(); // 点击导出
    document.body.removeChild(a); // 下载完成移除元素
    window.URL.revokeObjectURL(href); // 释放掉blob对象
  }).catch(() => {});
}

onMounted(() => {
  // 初始化性别字典
  getGenderOptions();
  // 初始化部门
  getDeptOptions();
  // 初始化用户列表数据
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 部门树 -->
      <el-col :span="4" :xs="24">
        <el-card class="box-card">
          <el-input
            v-model="deptName"
            :prefix-icon="Search"
            clearable
            :placeholder="$t('system.user.deptPlaceholder')"
            style="margin-bottom: 20px"
          />
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            :expand-on-click-node="false"
            :filter-node-method="filterDeptNode"
            :props="{ children: 'children', label: 'label', disabled: '' }"
            default-expand-all
            @node-click="handleDeptNodeClick"
          ></el-tree>
        </el-card>
      </el-col>

      <!-- 用户数据 -->
      <el-col :span="20" :xs="24">
        <div class="search">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item :label="$t('common.keyword')" prop="keywords">
              <el-input
                v-model="queryParams.keywords"
                clearable
                :placeholder="$t('system.user.keywordPlaceholder')"
                style="width: 200px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>

            <el-form-item :label="$t('common.status')" prop="status">
              <el-select
                v-model="queryParams.status"
                clearable
                :placeholder="$t('common.all')"
                style="width: 200px"
              >
                <el-option :label="$t('common.enabled')" value="1"/>
                <el-option :label="$t('common.disabled')" value="0"/>
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button :icon="Search" type="primary" @click="handleQuery"
              >{{ $t('common.search') }}
              </el-button
              >
              <el-button :icon="Refresh" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-card>
          <template #header>
            <el-form-item style="float: left">
              <el-button
                v-hasPerm="['sys:user:save']"
                :icon="Plus"
                type="success"
                @click="handleAdd"
              >{{ $t('common.add') }}
              </el-button
              >
              <el-button
                v-hasPerm="['sys:user:delete']"
                :disabled="ids.length === 0"
                :icon="Delete"
                type="danger"
                @click="handleDelete"
              >{{ $t('common.delete') }}
              </el-button
              >
            </el-form-item>
            <el-form-item style="float: right">
              <el-dropdown v-hasPerm="['sys:user:_import']" split-button style="margin-left: 12px">
                {{ $t('common.import') }}
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :icon="Download"
                      @click="handleDownloadTemplate"
                    >{{ $t('common.downloadTemplate') }}
                    </el-dropdown-item
                    >
                    <el-dropdown-item :icon="Top" @click="showImportDialog"
                    >{{ $t('common.importData') }}
                    </el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                v-hasPerm="['sys:user:_export']"
                :icon="Download"
                style="margin-left: 12px"
                @click="handleExport"
              >{{ $t('common.export') }}
              </el-button
              >
            </el-form-item>
          </template>

          <el-table
            v-loading="loading"
            :data="userList"
            @selection-change="handleSelectionChange"
          >
            <el-table-column align="center" type="selection" width="50"/>
            <el-table-column
              key="id"
              align="center"
              :label="$t('system.user.id')"
              prop="id"
              width="200"
            />
            <el-table-column
              key="username"
              align="center"
              :label="$t('system.user.username')"
              prop="username"
            />
            <el-table-column
              align="center"
              :label="$t('system.user.nickname')"
              prop="nickname"
              width="120"
            />

            <el-table-column
              align="center"
              :label="$t('system.user.gender')"
              prop="gender"
              width="100">
              <template #default="scope">
                <span v-if="scope.row.gender === 0">{{ $t('common.unknown') }}</span>
                <span v-else-if="scope.row.gender === 1">{{ $t('common.male') }}</span>
                <span v-else-if="scope.row.gender === 2">{{ $t('common.female') }}</span>
              </template>
            </el-table-column>

            <el-table-column
              align="center"
              :label="$t('system.user.dept')"
              prop="deptName"
              width="120"
            />
            <el-table-column
              align="center"
              :label="$t('system.user.mobile')"
              prop="mobile"
              width="120"
            />

            <el-table-column align="center" :label="$t('common.status')" prop="status">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="handleStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column
              align="center"
              :label="$t('common.createTime')"
              prop="createTime"
              width="180"
            ></el-table-column>
            <el-table-column align="left" :label="$t('common.operation')" width="200">
              <template #default="scope">
                <el-button v-hasPerm="['sys:user:update:password']"
                           link
                           type="success"
                           @click="resetPassword(scope.row)"
                >{{ $t('system.user.resetPassword') }}
                </el-button
                >
                <el-button
                  v-hasPerm="['sys:user:update']"
                  link
                  type="primary"
                  @click="handleUpdate(scope.row)"
                >{{ $t('common.edit') }}
                </el-button
                >
                <el-button
                  v-hasPerm="['sys:user:delete']"
                  link
                  type="danger"
                  @click="handleDelete(scope.row)"
                >{{ $t('common.delete') }}
                </el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-if="total > 0"
            v-model:limit="queryParams.pageSize"
            v-model:page="queryParams.pageNum"
            :total="total"
            @pagination="handleQuery"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户表单 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      append-to-body
      width="600px"
      @close="closeDialog"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item :label="$t('system.user.username')" prop="username">
          <el-input
            v-model="formData.username"
            :readonly="!!formData.id"
            :placeholder="$t('system.user.usernamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('system.user.nickname')" prop="nickname">
          <el-input v-model="formData.nickname" :placeholder="$t('system.user.nicknamePlaceholder')"/>
        </el-form-item>

        <el-form-item :label="$t('system.user.dept')" prop="deptId">
          <el-tree-select
            v-model="formData.deptId"
            :data="deptOptions"
            :render-after-expand="false"
            check-strictly
            filterable
            :placeholder="$t('system.user.deptSelectPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('system.user.mobile')" prop="mobile">
          <el-input
            v-model="formData.mobile"
            maxlength="11"
            :placeholder="$t('system.user.mobilePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('system.user.email')" prop="email">
          <el-input
            v-model="formData.email"
            maxlength="50"
            :placeholder="$t('system.user.emailPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('common.status')" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">{{ $t('common.normal') }}</el-radio>
            <el-radio :label="0">{{ $t('common.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('system.user.userGender')" prop="gender">
          <el-select v-model="formData.gender" :placeholder="$t('common.pleaseSelect')">
            <el-option :value="0" :label="$t('common.unknown')"/>
            <el-option :value="1" :label="$t('common.male')"/>
            <el-option :value="2" :label="$t('common.female')"/>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('system.user.role')" prop="roleIds">
          <el-select v-model="formData.roleIds" multiple :placeholder="$t('common.pleaseSelect')">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="closeDialog">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- import dialog -->
    <el-dialog
      v-model="importDialog.visible"
      :title="importDialog.title"
      append-to-body
      width="600px"
      @close="closeImportDialog"
    >
      <el-form
        ref="importFormRef"
        :model="importFormData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item :label="$t('system.user.dept')" prop="deptId">
          <el-tree-select
            v-model="importFormData.deptId"
            :data="deptOptions"
            check-strictly
            filterable
            :placeholder="$t('system.user.deptSelectPlaceholder2')"
          />
        </el-form-item>

        <el-form-item :label="$t('system.user.role')" prop="roleIds">
          <el-select
            v-model="importFormData.roleIds"
            multiple
            :placeholder="$t('common.pleaseSelect')"
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Excel">
          <el-upload
            :auto-upload="false"
            :file-list="excelFilelist"
            :limit="1"
            :on-change="handleExcelChange"
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            action=""
            class="upload-demo"
            drag
          >
            <el-icon class="el-icon--upload">
              <upload-filled/>
            </el-icon>
            <div class="el-upload__text">
              {{ $t('system.user.dragText') }}
              <em>{{ $t('system.user.clickUpload') }}</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">xls/xlsx files</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitImportForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="closeImportDialog">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
