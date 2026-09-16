<template>
  <div class="app-container">
    <div class="search">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams">
        <el-form-item :label="$t('common.keyword')" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            clearable
            :placeholder="$t('system.menu.menuName')"
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

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <el-button v-hasPerm="['sys:menu:save']" :icon="Plus" type="success" @click="handleAdd"
        >{{ $t('common.add') }}
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
        <el-table-column :label="$t('system.menu.menuName')">
          <template #default="scope">
            <svg-icon
              :icon-class="
                scope.row.type === 2 ? 'button' : scope.row.icon
              "
            />
            {{ scope.row.name }}
          </template>
        </el-table-column>

        <el-table-column align="center" :label="$t('system.menu.menuType')" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 1" type="success"
            >{{ $t('system.menu.directory') }}
            </el-tag
            >
            <el-tag v-if="scope.row.type === 2" type="success"
            >{{ $t('system.menu.menu') }}
            </el-tag
            >
            <el-tag v-if="scope.row.type === 3" type="danger"
            >{{ $t('system.menu.button') }}
            </el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          :label="$t('system.menu.perm')"
          prop="perm"
          width="200"
        />

        <el-table-column align="center" :label="$t('common.status')" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.visible === 1" type="success">{{ $t('system.menu.visible') }}</el-tag>
            <el-tag v-else type="info">{{ $t('system.menu.hidden') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" :label="$t('common.sort')" prop="sort" width="100"/>

        <el-table-column
          align="center"
          :label="$t('common.createTime')"
          prop="createTime"
          width="180"
        >
        </el-table-column>

        <el-table-column
          align="center"
          :label="$t('common.updateTime')"
          prop="updateTime"
          width="180"
        >
        </el-table-column>

        <el-table-column align="center" :label="$t('common.operation')" width="200">
          <template #default="scope">
            <el-button
              v-if="scope.row.type === 1"
              v-hasPerm="['sys:menu:save']"
              link
              type="success"

              @click.stop="handleAdd(scope.row)"
            >
              {{ $t('common.add') }}
            </el-button>

            <el-button
              v-hasPerm="['sys:menu:update']"
              link
              type="primary"
              @click.stop="handleUpdate(scope.row)"
            >
              {{ $t('common.modify') }}
            </el-button>
            <el-button
              v-hasPerm="['sys:menu:delete']"
              link
              type="danger"
              @click.stop="handleDelete(scope.row)"
            >
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
      width="750px"
      @close="cancel"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="$t('system.menu.parentMenu')" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="menuOptions"
            :render-after-expand="false"
            check-strictly
            filterable
            :placeholder="$t('system.menu.selectParentMenu')"
          />
        </el-form-item>

        <el-form-item :label="$t('system.menu.menuName')" prop="name">
          <el-input v-model="formData.name" :placeholder="$t('system.menu.nameRequired')"/>
        </el-form-item>

        <el-form-item :label="$t('system.menu.menuType')" prop="type">
          <el-radio-group
            v-model="formData.type"
            @change="handleMenuTypeChange"
          >
            <el-radio :label="1">{{ $t('system.menu.directory') }}</el-radio>
            <el-radio :label="2">{{ $t('system.menu.menu') }}</el-radio>
            <el-radio :label="3">{{ $t('system.menu.button') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.type === 1 || formData.type === 2"
          :label="$t('system.menu.routePath')"
          prop="path"
        >
          <el-input v-if="formData.type === 1" v-model="formData.path" placeholder="system"/>
          <el-input v-if="formData.type === 2" v-model="formData.path" placeholder="user"/>
        </el-form-item>

        <el-form-item v-if="formData.type === 1" :label="$t('system.menu.alwaysShow')">
          <el-radio-group v-model="formData.alwaysShow">
            <el-radio :label="1">{{ $t('system.menu.yes') }}</el-radio>
            <el-radio :label="0">{{ $t('system.menu.no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 组件页面完整路径 -->
        <el-form-item
          v-if="formData.type === 2"
          :label="$t('system.menu.pagePath')"
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
          :label="$t('system.menu.perm')"
          prop="perm"
        >
          <el-input v-model="formData.perm" placeholder="sys:user:save"/>
        </el-form-item>

        <el-form-item
          v-if="formData.type !== 3"
          :label="$t('system.menu.icon')"
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
                :placeholder="$t('system.menu.clickSelectIcon')"
                readonly
              >
                <template #prefix>
                  <svg-icon :icon-class="formData.icon"/>
                </template>
              </el-input>
            </template>

            <icon-select @selected="selected"/>
          </el-popover>
        </el-form-item>

        <el-form-item v-if="formData.type !== 3" :label="$t('common.status')">
          <el-radio-group v-model="formData.visible">
            <el-radio :label="1">{{ $t('system.menu.visible') }}</el-radio>
            <el-radio :label="0">{{ $t('system.menu.hidden') }}</el-radio>
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
          <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="cancel">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import {onMounted, reactive, ref, toRefs} from 'vue';
  import {useI18n} from 'vue-i18n';
  import {Plus, Refresh, Search} from '@element-plus/icons-vue';
  import {ElForm, ElPopover} from 'element-plus';

  import {Menu, MenuForm, MenuQuery} from '@/api/system/menu/types';
  // API 依赖
  import {addMenu, deleteMenu, getMenuDetail, listMenuOptions, listMenus, updateMenu,} from '@/api/system/menu';

  import SvgIcon from '@/components/SvgIcon/index.vue';
  import IconSelect from '@/components/IconSelect/index.vue';

  const emit = defineEmits(['menuClick']);
  const queryFormRef = ref(ElForm);
  const dataFormRef = ref(ElForm);
  const popoverRef = ref(ElPopover);

  const {t} = useI18n();

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
    rules: {
      parentId: [{required: true, message: t('system.menu.parentMenuRequired'), trigger: 'blur'}],
      name: [{required: true, message: t('system.menu.nameRequired'), trigger: 'blur'}],
      type: [{required: true, message: t('system.menu.typeRequired'), trigger: 'blur'}],
      path: [{required: true, message: t('system.menu.pathRequired'), trigger: 'blur'}],
      component: [
        {required: true, message: t('system.menu.componentRequired'), trigger: 'blur'},
      ],
    },
    menuOptions: [] as OptionType[],
    currentRow: undefined,
    cacheData: {
      menuType: 1,
      menuPath: '',
    },
  });

  const {
    loading,
    queryParams,
    menuList,
    dialog,
    formData,
    rules,
    menuOptions,
    cacheData,
  } = toRefs(state);

  /**
   * 查询
   */
  function handleQuery() {
    // 重置父组件
    emit('menuClick', null);
    state.loading = true;
    listMenus(state.queryParams)
      .then(({data}) => {
        state.menuList = data;
      })
      .finally(() => {
        state.loading = false;
      });
  }

  /**
   * 加载菜单下拉树
   */
  async function loadMenuData() {
    const menuOptions: any[] = [];
    await listMenuOptions().then(({data}) => {
      const menuOption = {value: '0', label: t('system.menu.topMenu'), children: data};
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

  function handleRowClick(row: Menu) {
    state.currentRow = JSON.parse(JSON.stringify(row));
    emit('menuClick', row);
  }

  /**
   * 新增菜单打开
   */
  async function handleAdd(row: Menu) {
    await loadMenuData();
    dialog.value = {
      title: t('system.menu.addMenu'),
      visible: true,
    };

    // 重置表单，避免残留上次编辑的数据
    formData.value = {
      id: undefined,
      parentId: '0',
      name: '',
      type: 1,
      visible: 1,
      sort: 1,
      component: undefined,
      path: '',
      perm: undefined,
      icon: undefined,
      alwaysShow: undefined,
    };

    if (row && row.id) {
      // 行点击新增
      formData.value.parentId = String(row.id);
    } else if (state.currentRow) {
      // 选择行
      formData.value.parentId = (state.currentRow as any).id;
    } else {
      // 未选择行
      formData.value.parentId = '0';
    }
  }

  /**
   * 编辑菜单
   */
  async function handleUpdate(row: MenuForm) {
    await loadMenuData();
    state.dialog = {
      title: t('system.menu.editMenu'),
      visible: true,
    };
    const id = row.id as string;
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
          updateMenu(state.formData.id, state.formData)
            .then(() => {
              ElMessage.success(t('common.updateSuccess'));
              cancel();
              handleQuery();
            })
            .catch(() => {});
        } else {
          addMenu(state.formData)
            .then(() => {
              ElMessage.success(t('common.addSuccess'));
              cancel();
              handleQuery();
            })
            .catch(() => {});
        }
      }
    });
  }

  /**
   * 删除菜单
   *
   * @param row
   */
  function handleDelete(row: Menu) {
    ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
      .then(() => {
        deleteMenu(row.id as number)
          .then(() => {
            ElMessage.success(t('common.deleteSuccess'));
            handleQuery();
          })
          .catch(() => {});
      })
      .catch(() => ElMessage.info(t('common.cancelledDelete')));
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
  }

  onMounted(() => {
    handleQuery();
  });
</script>
