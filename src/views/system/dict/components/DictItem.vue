<script lang="ts">
export default {
  name: 'dictItem',
};
</script>

<script lang="ts" setup>
import {onMounted, reactive, ref, toRefs, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {ElForm} from 'element-plus';

import {
  listDictItemPages,
  getDictItemData,
  saveDictItem,
  updateDictItem,
  deleteDictItems,
} from '@/api/system/dict';
import {Search, Plus, Edit, Refresh, Delete} from '@element-plus/icons-vue';
import {DictItem, DictItemForm, DictItemQuery} from '@/api/system/dict/types';

const props = defineProps({
  typeCode: {
    type: String,
    default: () => {
      return '';
    },
  },
  typeName: {
    type: String,
    default: () => {
      return '';
    },
  },
});

const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);

const {t} = useI18n();

const state = reactive({
  loading: true,
  // 选中ID数组
  ids: [] as number[],
  // 非单个禁用
  single: true,
  // 非多个禁用
  multiple: true,
  total: 0,
  queryParams: {pageNum: 1, pageSize: 10} as DictItemQuery,
  dictItemList: [] as DictItem[],
  dialog: {visible: false} as DialogType,
  formData: {
    typeCode: props.typeCode,
    typeName: props.typeName,
    status: 1,
    sort: 1,
  } as DictItemForm,
  rules: {
    name: [{required: true, message: t('system.dict.dictItemNameRequired'), trigger: 'blur'}],
    value: [{required: true, message: t('system.dict.dictItemValueRequired'), trigger: 'blur'}],
  },
  localDictCode: props.typeCode,
  localDictName: props.typeName,
});

// 监听字典类型切换，同步查询参数并重新加载字典项
watch(
  () => props.typeCode,
  (value) => {
    state.queryParams.typeCode = value;
    state.formData.typeCode = value;
    handleQuery();
  }
);

const {
  loading,
  multiple,
  queryParams,
  dictItemList,
  dialog,
  formData,
  rules,
  total,
} = toRefs(state);

function handleQuery() {
  if (state.queryParams.typeCode) {
    state.loading = true;
    listDictItemPages(state.queryParams)
      .then(({data}) => {
        state.dictItemList = data.list;
        state.total = data.total;
      })
      .finally(() => {
        state.loading = false;
      });
  } else {
    state.dictItemList = [];
    state.total = 0;
    state.queryParams.pageNum = 1;
    state.loading = false;
  }
}

function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: DictItem[]) {
  state.ids = selection.map((item: DictItem) => item.id);
  state.single = selection.length !== 1;
  state.multiple = !selection.length;
}

function handleAdd() {
  if (!state.formData.typeCode) {
    ElMessage.warning(t('system.dict.selectDictTypeFirst'));
    return;
  }
  // 重置表单，避免残留上次编辑的数据（保留当前字典类型）
  state.formData = {
    id: undefined,
    typeCode: state.formData.typeCode,
    typeName: state.formData.typeName,
    name: '',
    code: '',
    value: '',
    status: 1,
    sort: 1,
    remark: '',
  };
  state.dialog = {
    title: t('system.dict.addDictItem'),
    visible: true,
  };
}

function handleUpdate(row: DictItem) {
  state.dialog = {
    title: t('system.dict.updateDictItem'),
    visible: true,
  };
  const id = row.id;
  getDictItemData(id).then(({data}) => {
    state.formData = data;
  });
}

function submitForm() {
  dataFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      if (state.formData.id) {
        updateDictItem(state.formData.id, state.formData)
          .then(() => {
            ElMessage.success(t('common.updateSuccess'));
            cancel();
            handleQuery();
          })
          .catch(() => {});
      } else {
        saveDictItem(state.formData)
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

function cancel() {
  state.dialog.visible = false;
  state.formData.id = undefined;
  dataFormRef.value.resetFields();
}

function handleDelete(row: DictItem) {
  const ids = [row.id || state.ids].join(',');
  ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
    .then(() => {
      deleteDictItems(ids)
        .then(() => {
          ElMessage.success(t('common.deleteSuccess'));
          handleQuery();
        })
        .catch(() => {});
    })
    .catch(() => ElMessage.info(t('common.cancelledDelete')));
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form ref="queryFormRef" :inline="true" :model="queryParams">
      <el-form-item>
        <el-button v-hasPerm="['sys:dict:item:save']" :icon="Plus" type="success" @click="handleAdd"
        >{{ $t('common.add') }}
        </el-button
        >
        <el-button
          v-hasPerm="['sys:dict:item:delete']"
          :disabled="multiple"
          :icon="Delete"
          type="danger"
          @click="handleDelete"
        >{{ $t('common.delete') }}
        </el-button
        >
      </el-form-item>
      <el-form-item prop="keywords">
        <el-input
          v-model="queryParams.keywords"
          clearable
          :placeholder="$t('system.dict.dictItemName')"
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

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="dictItemList"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column align="center" type="selection" width="55"/>
      <el-table-column :label="$t('system.dict.dictItemName')" prop="name"/>
      <el-table-column :label="$t('system.dict.dictItemValue')" prop="value"/>
      <el-table-column align="center" :label="$t('common.status')">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 1" type="success">{{ $t('common.enabled') }}</el-tag>
          <el-tag v-else type="info">{{ $t('common.disabled') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" :label="$t('common.operation')">
        <template #default="scope">
          <el-button
            v-hasPerm="['sys:dict:item:update']"
            :icon="Edit"
            circle
            plain
            type="primary"
            @click.stop="handleUpdate(scope.row)"
          />
          <el-button
            v-hasPerm="['sys:dict:item:delete']"
            :icon="Delete"
            circle
            plain
            type="danger"
            @click.stop="handleDelete(scope.row)"
          />
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

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="500px"
      @close="cancel"
    >
      <el-form
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="$t('system.dict.dictTypeName')">{{ typeName }}</el-form-item>
        <el-form-item :label="$t('system.dict.dictItemName')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="$t('system.dict.dictItemNamePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('system.dict.dictItemValue')" prop="value">
          <el-input v-model="formData.value" :placeholder="$t('system.dict.dictItemValuePlaceholder')"/>
        </el-form-item>
        <el-form-item :label="$t('common.sort')" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            style="width: 80px"
          />
        </el-form-item>
        <el-form-item :label="$t('common.status')" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">{{ $t('common.normal') }}</el-radio>
            <el-radio :label="0">{{ $t('common.stop') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('system.dict.remark')" prop="remark">
          <el-input v-model="formData.remark" type="textarea"></el-input>
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
