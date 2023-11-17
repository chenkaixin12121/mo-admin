<template>
  <div class="app-container">
    <div class="search">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            clearable
            placeholder="菜单名称"
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

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <el-button :icon="Plus" v-hasPerm="['sys:menu:save']" type="success" @click="handleAdd"
        >新增
        </el-button
        >
      </template>

      <el-table
        v-loading="loading"
        :data="menuList"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        highlight-current-row
        row-key="id"
        @row-click="handleRowClick"
      >
        <el-table-column label="菜单名称">
          <template #default="scope">
            <svg-icon
              :icon-class="
                scope.row.type === 2 ? 'button' : scope.row.icon
              "
            />
            {{ scope.row.name }}
          </template>
        </el-table-column>

        <el-table-column align="center" label="菜单类型" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 1" type="success"
            >目录
            </el-tag
            >
            <el-tag v-if="scope.row.type === 2" type="success"
            >菜单
            </el-tag
            >
            <el-tag v-if="scope.row.type === 3" type="danger"
            >按钮
            </el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="权限标识"
          prop="perm"
          width="200"
        />

        <el-table-column align="center" label="状态" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.visible === 1" type="success">显示</el-tag>
            <el-tag v-else type="info">隐藏</el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" label="排序" prop="sort" width="100"/>

        <el-table-column
          align="center"
          label="创建时间"
          prop="createTime"
          width="200"
        >
        </el-table-column>

        <el-table-column
          align="center"
          label="修改时间"
          prop="updateTime"
          width="200"
        >
        </el-table-column>

        <el-table-column align="center" label="操作" width="200">
          <template #default="scope">
            <el-button
              v-if="scope.row.type === 1"
              v-hasPerm="['sys:user:save']"
              link
              type="success"

              @click.stop="handleAdd(scope.row)"
            >
              新增
            </el-button>

            <el-button
              link
              v-hasPerm="['sys:user:update']"
              type="primary"
              @click.stop="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button
              link
              v-hasPerm="['sys:user:delete']"
              type="danger"
              @click.stop="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- dialog -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="750px"
      @close="cancel"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="menuOptions"
            :render-after-expand="false"
            check-strictly
            filterable
            placeholder="选择上级菜单"
          />
        </el-form-item>

        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入菜单名称"/>
        </el-form-item>

        <el-form-item label="菜单类型" prop="type">
          <el-radio-group
            v-model="formData.type"
            @change="handleMenuTypeChange"
          >
            <el-radio :label=1>目录</el-radio>
            <el-radio :label=2>菜单</el-radio>
            <el-radio :label=3>按钮</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.type === 1 || formData.type === 2"
          label="路由路径"
          prop="path"
        >
          <el-input v-model="formData.path" v-if="formData.type === 1" placeholder="system"/>
          <el-input v-model="formData.path" v-if="formData.type === 2" placeholder="user"/>
        </el-form-item>

        <el-form-item v-if="formData.type === 1" label="始终显示">
          <el-radio-group v-model="formData.alwaysShow">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 组件页面完整路径 -->
        <el-form-item
          v-if="formData.type === 2"
          label="页面路径"
          prop="component"
        >
          <el-input
            v-model="formData.component"
            placeholder="system/user/index"
            style="width: 95%"
          >
            <template #prepend
            >src/views/
            </template
            >
            <template #append>.vue</template>
          </el-input>
        </el-form-item>

        <!-- 权限标识 -->
        <el-form-item
          v-if="formData.type === 3"
          label="权限标识"
          prop="perm"
        >
          <el-input v-model="formData.perm" placeholder="sys:user:save"/>
        </el-form-item>

        <el-form-item
          v-if="formData.type !== 3"
          label="图标"
          prop="icon"
        >
          <el-popover
            ref="popoverRef"
            :width="570"
            placement="bottom-start"
            trigger="click"
          >
            <template #reference>
              <el-input
                v-model="formData.icon"
                placeholder="点击选择图标"
                readonly
                @click="iconSelectVisible = true"
              >
                <template #prefix>
                  <svg-icon :icon-class="formData.icon"/>
                </template>
              </el-input>
            </template>

            <icon-select @selected="selected"/>
          </el-popover>
        </el-form-item>

        <el-form-item v-if="formData.type !== 3" label="状态">
          <el-radio-group v-model="formData.visible">
            <el-radio :label="1">显示</el-radio>
            <el-radio :label="0">隐藏</el-radio>
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
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref, toRefs} from 'vue';
import {Plus, Refresh, Search} from '@element-plus/icons-vue';
import {ElForm, ElMessage, ElMessageBox, ElPopover} from 'element-plus';

import {Menu, MenuForm, MenuQuery} from '@/api/system/menu/types';
// API 依赖
import {addMenu, deleteMenu, getMenuDetail, listMenuOptions, listMenus, updateMenu,} from '@/api/system/menu';

import SvgIcon from '@/components/SvgIcon/index.vue';
import IconSelect from '@/components/IconSelect/index.vue';

const emit = defineEmits(['menuClick']);
const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);
const popoverRef = ref(ElPopover);

const state = reactive({
  loading: true,
  // 选中ID数组
  ids: [],
  // 非单个禁用
  single: true,
  // 非多个禁用
  multiple: true,
  queryParams: {} as MenuQuery,
  menuList: [] as Menu[],
  dialog: {visible: false} as DialogType,
  formData: {
    parentId: '0',
    name: '',
    type: 1,
    visible: 1,
    sort: 1,
    component: undefined,
  } as MenuForm,
  permUrl: {
    requestMethod: '',
    serviceName: '',
    requestPath: '',
  },
  rules: {
    parentId: [{required: true, message: '请选择顶级菜单', trigger: 'blur'}],
    name: [{required: true, message: '请输入菜单名称', trigger: 'blur'}],
    type: [{required: true, message: '请选择菜单类型', trigger: 'blur'}],
    path: [{required: true, message: '请输入路由路径', trigger: 'blur'}],
    component: [
      {required: true, message: '请输入组件完整路径', trigger: 'blur'},
    ],
  },
  menuOptions: [] as OptionType[],
  currentRow: undefined,
  // Icon选择器显示状态
  iconSelectVisible: false,
  cacheData: {
    menuType: 1,
    menuPath: '',
  },
  microServiceOptions: [] as OptionType[],
  requestMethodOptions: [] as OptionType[],
});

const {
  loading,
  queryParams,
  menuList,
  dialog,
  formData,
  rules,
  menuOptions,
  iconSelectVisible,
  cacheData,
} = toRefs(state);

/**
 * 查询
 */
function handleQuery() {
  // 重置父组件
  emit('menuClick', null);
  state.loading = true;
  listMenus(state.queryParams).then(({data}) => {
    state.menuList = data;
    state.loading = false;
  });
}

/**
 * 加载字典数据
 */
function loadDictOptions() {
}

/**
 * 加载菜单下拉树
 */
async function loadMenuData() {
  const menuOptions: any[] = [];
  await listMenuOptions().then(({data}) => {
    const menuOption = {value: '0', label: '顶级菜单', children: data};
    menuOptions.push(menuOption);
    state.menuOptions = menuOptions;
  });
}

/**
 * 重置查询
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

function handleRowClick(row: any) {
  state.currentRow = JSON.parse(JSON.stringify(row));
  emit('menuClick', row);
}

/**
 * 新增菜单打开
 */
async function handleAdd(row: any) {
  formData.value.id = undefined;
  await loadMenuData();
  loadDictOptions();
  dialog.value = {
    title: '添加菜单',
    visible: true,
  };

  if (row.id) {
    // 行点击新增

    formData.value.parentId = row.id;
  } else {
    // 工具栏新增

    if (state.currentRow) {
      // 选择行
      formData.value.parentId = (state.currentRow as any).id;
    } else {
      // 未选择行
      formData.value.parentId = '0';
    }
  }
}

/**
 * 编辑菜单
 */
async function handleUpdate(row: MenuForm) {
  await loadMenuData();
  state.dialog = {
    title: '编辑菜单',
    visible: true,
  };
  const id = row.id as string;
  loadDictOptions();
  getMenuDetail(id).then(({data}) => {
    state.formData = data;
    cacheData.value.menuType = data.type;
    cacheData.value.menuPath = data.path;
  });
}

/**
 * 菜单类型 change
 */
function handleMenuTypeChange(menuType: number) {
  if (menuType !== cacheData.value.menuType) {
    formData.value.path = '';
  } else {
    formData.value.path = cacheData.value.menuPath;
  }
}

/**
 * 菜单提交
 */
function submitForm() {
  dataFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      if (state.formData.id) {
        updateMenu(state.formData.id, state.formData).then(() => {
          ElMessage.success('修改成功');
          cancel();
          handleQuery();
        });
      } else {
        addMenu(state.formData).then(() => {
          ElMessage.success('新增成功');
          cancel();
          handleQuery();
        });
      }
    }
  });
}

/**
 * 删除菜单
 *
 * @param row
 */
function handleDelete(row: any) {
  ElMessageBox.confirm('确认删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteMenu(row.id).then(() => {
        ElMessage.success('删除成功');
        handleQuery();
      });
    })
    .catch(() => ElMessage.info('已取消删除'));
}

/**
 * 取消关闭弹窗
 */
function cancel() {
  dataFormRef.value.resetFields();
  state.dialog.visible = false;
}

/**
 * 选择图标后事件
 */
function selected(name: string) {
  state.formData.icon = name;
  state.iconSelectVisible = false;
}

onMounted(() => {
  handleQuery();
});
</script>
