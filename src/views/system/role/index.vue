<script lang="ts">
export default {
  name: 'role',
};
</script>

<script lang="ts" setup>
import {onMounted, reactive, ref, toRefs} from 'vue';
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

import {ElForm, ElMessage, ElMessageBox, ElTree} from 'element-plus';
import {Search, Plus, Refresh, Delete} from '@element-plus/icons-vue';
import {Role, RoleForm, RoleQuery} from '@/api/system/role/types';

const emit = defineEmits(['roleClick']);
const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);
const resourceRef = ref(ElTree);

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
    name: [{required: true, message: '请输入角色名称', trigger: 'blur'}],
    code: [{required: true, message: '请输入角色编码', trigger: 'blur'}],
    dataScope: [{required: true, message: '请选择数据权限', trigger: 'blur'}],
    status: [{required: true, message: '请选择状态', trigger: 'blur'}],
    sort: [{required: true, message: '请选择排序', trigger: 'blur'}],
  },
  menuDialogVisible: false,
  resourceOptions: [] as OptionType[],
  btnPerms: {} as any,
  // 勾选的菜单ID
  checkedMenuIds: new Set([]),
  allPermIds: [] as string[],
  // 选中的角色
  checkedRole: {
    id: '',
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
  listRolePages(state.queryParams).then(({data}) => {
    state.roleList = data.list;
    state.total = data.total;
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

function handleSelectionChange(selection: any) {
  state.ids = selection.map((item: any) => item.id);
}

function handleRowClick(row: any) {
  emit('roleClick', row);
}

function handleAdd() {
  dialog.value = {
    title: '添加角色',
    visible: true,
  };
}

function handleUpdate(row: any) {
  dialog.value = {
    title: '修改角色',
    visible: true,
  };
  const roleId = row.id || state.ids;
  getRoleFormDetail(roleId).then(({data}) => {
    state.formData = data;
  });
}

function submitFormData() {
  loading.value = true;
  dataFormRef.value.validate((valid: any) => {
    if (valid) {
      if (state.formData.id) {
        updateRole(state.formData.id as any, state.formData).then(() => {
          ElMessage.success('修改角色成功');
          closeDialog();
          handleQuery();
          loading.value = false;
        });
      } else {
        addRole(state.formData).then(() => {
          closeDialog();
          ElMessage.success('新增角色成功');
          handleQuery();
          loading.value = false;
        });
      }
    }
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
function handleDelete(row: any) {
  const ids = [row.id || state.ids].join(',');
  ElMessageBox.confirm('确认删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteRoles(ids).then(() => {
        ElMessage.success('删除成功');
        handleQuery();
      });
    })
    .catch(() => ElMessage.info('已取消删除'));
}

/**
 * 资源分配
 */
function showRoleMenuDialog(row: Role) {
  menuDialogVisible.value = true;
  loading.value = true;

  const roleId: any = row.id;
  checkedRole.value = {
    id: roleId,
    name: row.name,
  };

  // 获取所有的资源
  listResources().then((response) => {
    resourceOptions.value = response.data;
    // 角色拥有的资源
    getRoleMenuIds(roleId).then(({data}) => {
      // 勾选回显
      const checkedMenuIds = data;
      checkedMenuIds.forEach((menuId) =>
        resourceRef.value.setChecked(menuId, true)
      );

      loading.value = false;
    });
  });
}

/**
 * 分配资源提交
 */
function handleRoleResourceSubmit() {
  const checkedMenuIds: number[] = resourceRef.value
    .getCheckedNodes(false, true)
    .map((node: any) => node.value);

  updateRoleMenus(checkedRole.value.id, checkedMenuIds).then((res) => {
    ElMessage.success('分配权限成功');
    menuDialogVisible.value = false;
    handleQuery();
  });
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
        <el-form-item label="关键字" prop="name">
          <el-input
            v-model="queryParams.keywords"
            clearable
            placeholder="角色名称"
            @keyup.enter="handleQuery"
          />
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
        <el-button v-hasPerm="['sys:role:save']" :icon="Plus" type="success" @click="handleAdd"
        >新增
        </el-button
        >
        <el-button
          v-hasPerm="['sys:role:delete']"
          :disabled="ids.length === 0"
          :icon="Delete"
          type="danger"
          @click="handleDelete"
        >删除
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
        <el-table-column label="角色名称" min-width="150" prop="name"/>
        <el-table-column label="角色编码" prop="code" width="150"/>

        <el-table-column align="center" label="状态" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" label="排序" prop="sort" width="100"/>
        <el-table-column label="创建时间" prop="createTime" width="160"/>
        <el-table-column label="修改时间" prop="updateTime" width="160"/>

        <el-table-column align="left" label="操作">
          <template #default="scope">
            <el-button
              link
              v-hasPerm="['sys:role:resource']"
              type="success"
              @click.stop="showRoleMenuDialog(scope.row)"
            >
              资源分配
            </el-button>

            <el-button
              link
              v-hasPerm="['sys:role:update']"
              type="primary"
              @click.stop="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button v-hasPerm="['sys:role:delete']" link type="danger" @click.stop="handleDelete(scope.row)">
              删除
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
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称"/>
        </el-form-item>

        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入角色编码"/>
        </el-form-item>

        <el-form-item label="数据权限" prop="dataScope">
          <el-select v-model="formData.dataScope">
            <el-option :key="0" :value="0" label="全部数据"/>
            <el-option :key="10" :value="10" label="部门及子部门数据"/>
            <el-option :key="20" :value="20" label="本部门数据"/>
            <el-option :key="30" :value="30" label="本人数据"/>
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
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
          <el-button type="primary" @click="submitFormData">确 定</el-button>
          <el-button @click="closeDialog">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- assign permission dialog -->
    <el-dialog
      v-model="menuDialogVisible"
      :title="'【' + checkedRole.name + '】资源分配'"
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
          >确 定
          </el-button
          >
          <el-button @click="closeMenuDialogVisible">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
