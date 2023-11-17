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
  ElMessageBox,
  ElMessage,
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
    username: [{required: true, message: '用户名不能为空', trigger: 'blur'}],
    nickname: [
      {required: true, message: '用户昵称不能为空', trigger: 'blur'},
    ],
    deptId: [{required: true, message: '所属部门不能为空', trigger: 'blur'}],
    roleIds: [{required: true, message: '用户角色不能为空', trigger: 'blur'}],
    email: [
      {
        pattern: /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/,
        message: '请输入正确的邮箱地址',
        trigger: 'blur',
      },
    ],
    mobile: [
      {
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur',
      },
    ],
  },

  importDialog: {
    title: '用户导入',
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
function handleStatusChange(row: { [key: string]: any }) {
  const text = row.status === 1 ? '启用' : '停用';
  ElMessageBox.confirm(
    '确认要' + text + '' + row.username + '用户吗?',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      return updateUserStatus(row.id, row.status);
    })
    .then(() => {
      ElMessage.success(text + '成功');
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
  listUserPages(state.queryParams).then(({data}) => {
    state.userList = data.list;
    state.total = data.total;
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
function handleSelectionChange(selection: any) {
  state.ids = selection.map((item: any) => item.id);
}

/**
 * 重置密码
 */
function resetPassword(row: { [key: string]: any }) {
  ElMessageBox.prompt(
    '请输入用户「' + row.username + '」的新密码',
    '重置密码',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }
  )
    .then(({value}) => {
      if (!value) {
        ElMessage.warning('请输入新密码');
        return false;
      }
      updateUserPassword(row.id, value).then(() => {
        ElMessage.success('密码重置成功，新密码是：' + value);
      });
    })
    .catch(() => {
    });
}

/**
 * 添加用户
 **/
async function handleAdd() {
  state.dialog = {
    title: '添加用户',
    visible: true,
  };
  await getDeptOptions();
  await getRoleOptions();
}

/**
 * 修改用户
 **/
async function handleUpdate(row: { [key: string]: any }) {
  dialog.value = {
    title: '修改用户',
    visible: true,
  };

  const userId = row.id || state.ids;
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
  dataFormRef.value.validate((valid: any) => {
    if (valid) {
      const userId = state.formData.id;
      if (userId) {
        updateUser(userId, state.formData).then(() => {
          ElMessage.success('修改用户成功');
          closeDialog();
          handleQuery();
        });
      } else {
        addUser(state.formData).then(() => {
          ElMessage.success('新增用户成功');
          closeDialog();
          handleQuery();
        });
      }
    }
  });
}

/**
 * 删除用户
 */
function handleDelete(row: { [key: string]: any }) {
  const userIds = row.id || state.ids.join(',');
  ElMessageBox.confirm(
    '是否确认删除用户编号为「' + userIds + '」的数据项?',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(function () {
      deleteUsers(userIds).then(() => {
        ElMessage.success('删除成功');
        handleQuery();
      });
    })
    .catch(() => ElMessage.info('已取消删除'));
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
    a.download = decodeURI(
      response.headers['content-disposition'].split(';')[1].split('=')[1]
    ); // 获取后台设置的文件名称
    document.body.appendChild(a);
    a.click(); // 点击下载
    document.body.removeChild(a); // 下载完成移除元素
    window.URL.revokeObjectURL(href); // 释放掉blob对象
  });
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
    ElMessage.warning('上传Excel只能为xlsx、xls格式');
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
  importFormRef.value.validate((valid: any) => {
    if (valid) {
      if (!state.excelFile) {
        ElMessage.warning('上传Excel文件不能为空');
        return false;
      }

      const deptId = state.importFormData.deptId;
      const roleIds = state.importFormData.roleIds.join(',');
      importUser(deptId, roleIds, state.excelFile).then((response) => {
        ElMessage.success(response.data);
        closeImportDialog();
        handleQuery();
      });
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
    a.download = decodeURI(
      response.headers['content-disposition'].split(';')[1].split('=')[1]
    ); // 获取后台设置的文件名称
    document.body.appendChild(a);
    a.click(); // 点击导出
    document.body.removeChild(a); // 下载完成移除元素
    window.URL.revokeObjectURL(href); // 释放掉blob对象
  });
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
            placeholder="部门名称"
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
            <el-form-item label="关键字" prop="keywords">
              <el-input
                v-model="queryParams.keywords"
                clearable
                placeholder="用户名/昵称/手机号"
                style="width: 200px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-select
                v-model="queryParams.status"
                clearable
                placeholder="全部"
                style="width: 200px"
              >
                <el-option label="启用" value="1"/>
                <el-option label="禁用" value="0"/>
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button :icon="Search" type="primary" @click="handleQuery"
              >搜索
              </el-button
              >
              <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
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
              >新增
              </el-button
              >
              <el-button
                v-hasPerm="['sys:user:delete']"
                :disabled="ids.length === 0"
                :icon="Delete"
                type="danger"
                @click="handleDelete"
              >删除
              </el-button
              >
            </el-form-item>
            <el-form-item style="float: right">
              <el-dropdown v-hasPerm="['sys:user:_import']" split-button style="margin-left: 12px">
                导入
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :icon="Download"
                      @click="handleDownloadTemplate"
                    >下载模板
                    </el-dropdown-item
                    >
                    <el-dropdown-item :icon="Top" @click="showImportDialog"
                    >导入数据
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
              >导出
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
              label="编号"
              prop="id"
              width="200"
            />
            <el-table-column
              key="username"
              align="center"
              label="用户名"
              prop="username"
            />
            <el-table-column
              align="center"
              label="用户昵称"
              prop="nickname"
              width="120"
            />

            <el-table-column
              align="center"
              label="性别"
              prop="gender"
              width="100">
              <template #default="scope">
                <span v-if="scope.row.gender === 0">未知</span>
                <span v-if="scope.row.gender === 1">男</span>
                <span v-if="scope.row.gender === 2">女</span>
              </template>
            </el-table-column>

            <el-table-column
              align="center"
              label="部门"
              prop="deptName"
              width="120"
            />
            <el-table-column
              align="center"
              label="手机号码"
              prop="mobile"
              width="120"
            />

            <el-table-column align="center" label="状态" prop="status">
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
              label="创建时间"
              prop="createTime"
              width="180"
            ></el-table-column>
            <el-table-column align="left" label="操作" width="200">
              <template #default="scope">
                <el-button v-hasPerm="['sys:user:update:password']"
                           link
                           type="success"
                           @click="resetPassword(scope.row)"
                >重置密码
                </el-button
                >
                <el-button
                  v-hasPerm="['sys:user:update']"
                  link
                  type="primary"
                  @click="handleUpdate(scope.row)"
                >编辑
                </el-button
                >
                <el-button
                  v-hasPerm="['sys:user:delete']"
                  link
                  type="danger"
                  @click="handleDelete(scope.row)"
                >删除
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
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            :readonly="!!formData.id"
            placeholder="请输入用户名"
          />
        </el-form-item>

        <el-form-item label="用户昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入用户昵称"/>
        </el-form-item>

        <el-form-item label="所属部门" prop="deptId">
          <el-tree-select
            v-model="formData.deptId"
            :data="deptOptions"
            :render-after-expand="false"
            check-strictly
            filterable
            placeholder="请选择所属部门"
          />
        </el-form-item>

        <el-form-item label="手机号码" prop="mobile">
          <el-input
            v-model="formData.mobile"
            maxlength="11"
            placeholder="请输入手机号码"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            maxlength="50"
            placeholder="请输入邮箱"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="用户性别" prop="gender">
          <el-select v-model="formData.gender" placeholder="请选择">
            <el-option :value="0" label="未知"/>
            <el-option :value="1" label="男"/>
            <el-option :value="2" label="女"/>
          </el-select>
        </el-form-item>

        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="formData.roleIds" multiple placeholder="请选择">
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
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="closeDialog">取 消</el-button>
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
        <el-form-item label="部门" prop="deptId">
          <el-tree-select
            v-model="importFormData.deptId"
            :data="deptOptions"
            check-strictly
            filterable
            placeholder="请选择部门"
          />
        </el-form-item>

        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="importFormData.roleIds"
            multiple
            placeholder="请选择"
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
              将文件拖到此处，或
              <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">xls/xlsx files</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitImportForm">确 定</el-button>
          <el-button @click="closeImportDialog">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
