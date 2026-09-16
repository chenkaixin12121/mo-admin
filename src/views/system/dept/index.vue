<script lang="ts">
export default {
  name: 'dept',
};
</script>

<script lang="ts" setup>
import {onMounted, reactive, ref, toRefs} from 'vue';
import {useI18n} from 'vue-i18n';

import {
  getDeptForm,
  deleteDept,
  updateDept,
  addDept,
  listDeptOptions,
  listDepartments,
} from '@/api/system/dept';

import {Search, Plus, Refresh, Delete} from '@element-plus/icons-vue';
import {ElForm} from 'element-plus';
import {Dept, DeptForm, DeptQuery} from '@/api/system/dept/types';

const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);

const {t} = useI18n();

const state = reactive({
  loading: false,
  // 选中ID数组
  ids: [] as string[],
  // 表格树数据
  dataList: [] as Dept[],
  deptOptions: [] as OptionType[],
  dialog: {visible: false} as DialogType,
  queryParams: {} as DeptQuery,
  formData: {
    sort: 1,
    status: 1,
  } as DeptForm,
  rules: {
    parentId: [
      {required: true, message: t('system.dept.parentRequired'), trigger: 'blur'},
    ],
    name: [{required: true, message: t('system.dept.nameRequired'), trigger: 'blur'}],
    sort: [{required: true, message: t('system.dept.sortRequired'), trigger: 'blur'}],
  },
});

const {
  ids,
  loading,
  dataList,
  deptOptions,
  queryParams,
  formData,
  rules,
  dialog,
} = toRefs(state);

/**
 * 查询
 */
function handleQuery() {
  loading.value = true;
  listDepartments(state.queryParams)
    .then(({data}) => {
      dataList.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 重置
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: Dept[]) {
  state.ids = selection.map((item: Dept) => item.id);
}

/**
 * 获取部门下拉数据
 */
async function getDeptOptions() {
  const deptOptions: any[] = [];
  listDeptOptions().then((response) => {
    const rootDeptOption = {
      value: '0',
      label: t('system.dept.topDept'),
      children: response.data,
    };
    deptOptions.push(rootDeptOption);
    state.deptOptions = deptOptions;
  });
}

/**
 * 添加
 */
function handleAdd(row: Dept) {
  getDeptOptions();
  // 重置表单，避免残留上次编辑的数据；工具栏新增时 row 为事件对象，按顶级部门处理
  formData.value = {
    id: undefined,
    parentId: row && row.id ? row.id : '0',
    name: '',
    sort: 1,
    status: 1,
  };
  dialog.value = {
    title: t('system.dept.addDept'),
    visible: true,
  };
}

/**
 * 修改
 */
async function handleUpdate(row: Dept) {
  await getDeptOptions();
  const deptId = row.id;
  state.dialog = {
    title: t('system.dept.updateDept'),
    visible: true,
  };
  getDeptForm(deptId).then((response: any) => {
    state.formData = response.data;
  });
}

/**
 * 提交
 */
function submitForm() {
  dataFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (state.formData.id) {
        updateDept(state.formData.id, state.formData)
          .then(() => {
            ElMessage.success(t('common.updateSuccess'));
            closeDialog();
            handleQuery();
          })
          .catch(() => {});
      } else {
        addDept(state.formData)
          .then(() => {
            ElMessage.success(t('common.addSuccess'));
            closeDialog();
            handleQuery();
          })
          .catch(() => {});
      }
    }
  });
}

/**
 * 删除
 */
function handleDelete(row: Dept) {
  const ids = [row.id || state.ids].join(',');
  if (!ids) {
    ElMessage.warning(t('common.noSelection'));
    return;
  }

  ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      deleteDept(ids)
        .then(() => {
          handleQuery();
          ElMessage.success(t('common.deleteSuccess'));
        })
        .catch(() => {});
    })
    .catch(() => ElMessage.info(t('common.cancelledDelete')));
}

/**
 * 关闭弹窗
 **/
function closeDialog() {
  dialog.value.visible = false;
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();
}

onMounted(() => {
  handleQuery();
});
</script>
<template>
  <div class="app-container">
    <div class="search">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams">
        <el-form-item :label="$t('common.keyword')" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            :placeholder="$t('system.dept.deptName')"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item :label="$t('system.dept.deptStatus')" prop="status">
          <el-select
            v-model="queryParams.status"
            clearable
            :placeholder="$t('system.dept.deptStatus')"
          >
            <el-option :value="1" :label="$t('common.normal')"/>
            <el-option :value="0" :label="$t('common.disabled')"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            :icon="Search"
            class="filter-item"
            type="primary"
            @click="handleQuery"
          >
            {{ $t('common.search') }}
          </el-button>
          <el-button :icon="Refresh" @click="resetQuery">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card>
      <!--toolbar-->
      <template #header>
        <el-button v-hasPerm="['sys:dept:save']" :icon="Plus" type="success" @click="handleAdd"
        >{{ $t('common.add') }}
        </el-button
        >
        <el-button
          v-hasPerm="['sys:dept:delete']"
          :disabled="ids.length === 0"
          :icon="Delete"
          type="danger"
          @click="handleDelete"
        >{{ $t('common.delete') }}
        </el-button>
      </template>

      <!--table-->
      <el-table
        v-loading="loading"
        :data="dataList"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column :label="$t('system.dept.deptName')" min-width="300" prop="name"/>
        <el-table-column :label="$t('common.status')" prop="status" width="200">
          <template #default="scope">
            <el-tag v-if="scope.row.status == 1" type="success">{{ $t('common.normal') }}</el-tag>
            <el-tag v-else type="info">{{ $t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('common.sort')" prop="sort" width="200"/>

        <el-table-column align="center" :label="$t('common.createTime')" prop="createTime" width="180"/>
        <el-table-column align="center" :label="$t('common.updateTime')" prop="updateTime" width="180"/>

        <el-table-column align="center" :label="$t('common.operation')" width="150">
          <template #default="scope">
            <el-button v-hasPerm="['sys:dept:save']" link type="primary" @click.stop="handleAdd(scope.row)"
            >{{ $t('common.add') }}
            </el-button>
            <el-button
              v-hasPerm="['sys:dept:update']"
              link
              type="success"
              @click.stop="handleUpdate(scope.row)"
            >
              {{ $t('common.edit') }}
            </el-button>

            <el-button v-hasPerm="['sys:dept:delete']" link type="danger" @click.stop="handleDelete(scope.row)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- dialog -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      @closed="closeDialog"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item :label="$t('system.dept.parentDept')" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="deptOptions"
            :render-after-expand="false"
            check-strictly
            filterable
            :placeholder="$t('system.dept.selectParentDept')"
          />
        </el-form-item>
        <el-form-item :label="$t('system.dept.deptName')" prop="name">
          <el-input v-model="formData.name" :placeholder="$t('system.dept.deptNamePlaceholder')"/>
        </el-form-item>
        <el-form-item :label="$t('system.dept.displaySort')" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item :label="$t('system.dept.deptStatus')">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">{{ $t('common.normal') }}</el-radio>
            <el-radio :label="0">{{ $t('common.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="closeDialog">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
