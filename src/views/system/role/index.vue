<script lang="ts">
export default {
  name: 'role',
};
</script>

<script lang="ts" setup>
import {onMounted, reactive, ref, toRefs} from 'vue';
import {useI18n} from 'vue-i18n';
import {
  listRolePages,
  updateRole,
  getRoleFormDetail,
  addRole,
  deleteRoles,
  getRoleMenuIds,
  updateRoleMenus,
} from '@/api/system/role';
import {listResources} from '@/api/system/menu';

import {ElForm, ElTree} from 'element-plus';
import {Search, Plus, Refresh, Delete} from '@element-plus/icons-vue';
import {Role, RoleForm, RoleQuery} from '@/api/system/role/types';

const emit = defineEmits(['roleClick']);
const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);
const resourceRef = ref(ElTree);

const {t} = useI18n();

const state = reactive({
  loading: true,
  // 选中ID
  ids: [] as number[],
  queryParams: {
    pageNum: 1,
    pageSize: 10,
  } as RoleQuery,
  roleList: [] as Role[],
  total: 0,
  dialog: {
    title: '',
    visible: false,
  } as DialogType,
  formData: {} as RoleForm,
  rules: {
    name: [{required: true, message: t('system.role.roleNameRequired'), trigger: 'blur'}],
    code: [{required: true, message: t('system.role.roleCodeRequired'), trigger: 'blur'}],
    dataScope: [{required: true, message: t('system.role.dataScopeRequired'), trigger: 'blur'}],
    status: [{required: true, message: t('system.role.statusRequired'), trigger: 'blur'}],
    sort: [{required: true, message: t('system.role.sortRequired'), trigger: 'blur'}],
  },
  menuDialogVisible: false,
  resourceOptions: [] as OptionType[],
  btnPerms: {} as any,
  // 勾选的菜单ID
  checkedMenuIds: new Set([]),
  allPermIds: [] as string[],
  // 选中的角色
  checkedRole: {
    id: 0,
    name: '',
  },
});

const {
  ids,
  loading,
  queryParams,
  roleList,
  total,
  dialog,
  formData,
  rules,
  menuDialogVisible,
  checkedRole,
  resourceOptions,
} = toRefs(state);

/**
 * 查询
 */
function handleQuery() {
  emit('roleClick', {});
  state.loading = true;
  listRolePages(state.queryParams)
    .then(({data}) => {
      state.roleList = data.list;
      state.total = data.total;
    })
    .finally(() => {
      state.loading = false;
    });
}

/**
 * 重置查询
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: Role[]) {
  state.ids = selection.map((item: Role) => item.id);
}

function handleRowClick(row: Role) {
  emit('roleClick', row);
}

function handleAdd() {
  // 重置表单，避免残留上次编辑的数据
  state.formData = {
    id: undefined,
    name: '',
    code: '',
    sort: 0,
    status: 1,
    dataScope: 0,
  };
  dialog.value = {
    title: t('system.role.addRole'),
    visible: true,
  };
}

function handleUpdate(row: Role) {
  dialog.value = {
    title: t('system.role.updateRole'),
    visible: true,
  };
  const roleId = row.id;
  getRoleFormDetail(roleId).then(({data}) => {
    state.formData = data;
  });
}

function submitFormData() {
  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    loading.value = true;
    const request = state.formData.id
      ? updateRole(state.formData.id as any, state.formData)
      : addRole(state.formData);
    const successMsg = state.formData.id
      ? t('system.role.updateRoleSuccess')
      : t('system.role.addRoleSuccess');
    request
      .then(() => {
        ElMessage.success(successMsg);
        closeDialog();
        handleQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

/**
 * 取消
 */
function closeDialog() {
  dialog.value.visible = false;
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();
}

/**
 *  删除
 */
function handleDelete(row: Role) {
  const ids = [row.id || state.ids].join(',');
  ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      deleteRoles(ids)
        .then(() => {
          ElMessage.success(t('common.deleteSuccess'));
          handleQuery();
        })
        .catch(() => {});
    })
    .catch(() => ElMessage.info(t('common.cancelledDelete')));
}

/**
 * 资源分配
 */
function showRoleMenuDialog(row: Role) {
  menuDialogVisible.value = true;
  loading.value = true;

  const roleId: number = row.id;
  checkedRole.value = {
    id: roleId,
    name: row.name,
  };

  // 获取所有的资源
  listResources()
    .then((response) => {
      resourceOptions.value = response.data;
      // 角色拥有的资源
      return getRoleMenuIds(roleId).then(({data}) => {
        // 勾选回显
        const checkedMenuIds = data;
        checkedMenuIds.forEach((menuId) =>
          resourceRef.value.setChecked(menuId, true)
        );
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 分配资源提交
 */
function handleRoleResourceSubmit() {
  const checkedMenuIds: number[] = resourceRef.value
    .getCheckedNodes(false, true)
    .map((node: {value: number}) => node.value);

  updateRoleMenus(checkedRole.value.id, checkedMenuIds)
    .then(() => {
      ElMessage.success(t('system.role.assignSuccess'));
      menuDialogVisible.value = false;
      handleQuery();
    })
    .catch(() => {});
}

/**
 * 关闭资源弹窗
 */
function closeMenuDialogVisible() {
  menuDialogVisible.value = false;
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <div class="search">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams">
        <el-form-item :label="$t('common.keyword')" prop="name">
          <el-input
            v-model="queryParams.keywords"
            clearable
            :placeholder="$t('system.role.roleName')"
            @keyup.enter="handleQuery"
          />
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
        <el-button v-hasPerm="['sys:role:save']" :icon="Plus" type="success" @click="handleAdd"
        >{{ $t('common.add') }}
        </el-button
        >
        <el-button
          v-hasPerm="['sys:role:delete']"
          :disabled="ids.length === 0"
          :icon="Delete"
          type="danger"
          @click="handleDelete"
        >{{ $t('common.delete') }}
        </el-button
        >
      </template>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="roleList"
        border
        highlight-current-row
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column :label="$t('system.role.roleName')" min-width="150" prop="name"/>
        <el-table-column :label="$t('system.role.roleCode')" prop="code" width="150"/>

        <el-table-column align="center" :label="$t('common.status')" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">{{ $t('common.normal') }}</el-tag>
            <el-tag v-else type="info">{{ $t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" :label="$t('common.sort')" prop="sort" width="100"/>
        <el-table-column align="center" :label="$t('common.createTime')" prop="createTime" width="180"/>
        <el-table-column align="center" :label="$t('common.updateTime')" prop="updateTime" width="180"/>

        <el-table-column align="left" :label="$t('common.operation')">
          <template #default="scope">
            <el-button
              v-hasPerm="['sys:role:resource']"
              link
              type="success"
              @click.stop="showRoleMenuDialog(scope.row)"
            >
              {{ $t('system.role.resourceAssign') }}
            </el-button>

            <el-button
              v-hasPerm="['sys:role:update']"
              link
              type="primary"
              @click.stop="handleUpdate(scope.row)"
            >
              {{ $t('common.modify') }}
            </el-button>
            <el-button v-hasPerm="['sys:role:delete']" link type="danger" @click.stop="handleDelete(scope.row)">
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- pagination -->
      <pagination
        v-if="total > 0"
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNum"
        :total="total"
        @pagination="handleQuery"
      />
    </el-card>

    <!-- dialog -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      destroy-on-close
      width="500px"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="$t('system.role.roleName')" prop="name">
          <el-input v-model="formData.name" :placeholder="$t('system.role.roleNameRequired')"/>
        </el-form-item>

        <el-form-item :label="$t('system.role.roleCode')" prop="code">
          <el-input v-model="formData.code" :placeholder="$t('system.role.roleCodeRequired')"/>
        </el-form-item>

        <el-form-item :label="$t('system.role.dataScope')" prop="dataScope">
          <el-select v-model="formData.dataScope">
            <el-option :key="0" :value="0" :label="$t('system.role.allData')"/>
            <el-option :key="10" :value="10" :label="$t('system.role.deptAndChildren')"/>
            <el-option :key="20" :value="20" :label="$t('system.role.deptOnly')"/>
            <el-option :key="30" :value="30" :label="$t('system.role.selfOnly')"/>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('common.status')" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">{{ $t('common.normal') }}</el-radio>
            <el-radio :label="0">{{ $t('common.stop') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('common.sort')" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            style="width: 100px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFormData">{{ $t('common.confirm') }}</el-button>
          <el-button @click="closeDialog">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- assign permission dialog -->
    <el-dialog
      v-model="menuDialogVisible"
      :title="$t('system.role.assignDialogTitle', {name: checkedRole.name})"
      width="800px"
    >
      <el-scrollbar v-loading="loading" max-height="600px">
        <el-tree
          ref="resourceRef"
          :data="resourceOptions"
          :default-expand-all="true"
          node-key="value"
          show-checkbox
        >
          <template #default="{ data }">
            {{ data.label }}
          </template>
        </el-tree>
      </el-scrollbar>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleRoleResourceSubmit"
          >{{ $t('common.confirm') }}
          </el-button
          >
          <el-button @click="closeMenuDialogVisible">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
