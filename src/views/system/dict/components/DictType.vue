<script lang="ts">
export default {
  name: 'dictType',
};
</script>

<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form ref="queryFormRef" :inline="true" :model="state.queryParams">
      <el-form-item>
        <el-button :icon="Plus" v-hasPerm="['sys:dict:type:save']" type="success" @click="handleAdd"
        >新增
        </el-button
        >
        <el-button
          :disabled="state.multiple"
          :icon="Delete"
          type="danger"
          v-hasPerm="['sys:dict:type:delete']"
          @click="handleDelete"
        >删除
        </el-button>
      </el-form-item>

      <el-form-item prop="keywords">
        <el-input
          v-model="state.queryParams.keywords"
          clearable
          placeholder="字典名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button :icon="Search" type="primary" @click="handleQuery()"
        >搜索
        </el-button
        >
        <el-button :icon="Refresh" @click="resetQuery()">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="dictList"
      border
      highlight-current-row
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
    >
      <el-table-column align="center" type="selection" width="55"/>
      <el-table-column label="字典名称" prop="name"/>
      <el-table-column label="字典编码" prop="code"/>
      <el-table-column align="center" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" width="150">
        <template #default="scope">
          <el-button
            :icon="Edit"
            circle
            v-hasPerm="['sys:dict:type:update']"
            plain
            type="primary"
            @click.stop="handleUpdate(scope.row)"
          />
          <el-button
            :icon="Delete"
            circle
            v-hasPerm="['sys:dict:type:delete']"
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

    <!-- 弹窗表单 -->
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
        label-width="80px"
      >
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入字典名称"/>
        </el-form-item>
        <el-form-item label="字典编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入字典编码"/>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入内容"
            type="textarea"
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
import {
  listDictTypePages,
  getDictTypeForm,
  addDictType,
  updateDictType,
  deleteDictTypes,
} from '@/api/system/dict';
import {Search, Plus, Edit, Refresh, Delete} from '@element-plus/icons-vue';
import {ElForm, ElMessage, ElMessageBox} from 'element-plus';
import {Dict, DictQuery, DictTypeForm} from '@/api/system/dict/types';

const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);

const emit = defineEmits(['dictClick']);

const state = reactive({
  loading: true,
  // 选中ID数组
  ids: [] as number[],
  // 非单个禁用
  single: true,
  // 非多个禁用
  multiple: true,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
  } as DictQuery,
  dictList: [] as Dict[],
  total: 0,
  dialog: {visible: false} as DialogType,
  formData: {
    status: 1,
  } as DictTypeForm,
  rules: {
    name: [{required: true, message: '请输入字典名称', trigger: 'blur'}],
    code: [{required: true, message: '请输入字典编码', trigger: 'blur'}],
  },
});

const {total, dialog, loading, dictList, formData, rules, queryParams} =
  toRefs(state);

function handleQuery() {
  emit('dictClick', null);
  state.loading = true;
  listDictTypePages(state.queryParams).then(({data}) => {
    state.dictList = data.list;
    state.total = data.total;
    state.loading = false;
  });
}

function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

function handleSelectionChange(selection: any) {
  state.ids = selection.map((item: any) => item.id);
  state.single = selection.length !== 1;
  state.multiple = !selection.length;
}

function handleAdd() {
  state.dialog = {
    title: '添加字典',
    visible: true,
  };
}

function handleUpdate(row: any) {
  state.dialog = {
    title: '修改字典',
    visible: true,
  };
  const id = row.id || state.ids;
  getDictTypeForm(id).then(({data}) => {
    state.formData = data;
  });
}

function submitForm() {
  dataFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      if (state.formData.id) {
        updateDictType(state.formData.id, state.formData).then(() => {
          ElMessage.success('修改成功');
          cancel();
          handleQuery();
        });
      } else {
        addDictType(state.formData).then(() => {
          ElMessage.success('新增成功');
          cancel();
          handleQuery();
        });
      }
    }
  });
}

function cancel() {
  state.formData.id = undefined;
  dataFormRef.value.resetFields();
  state.dialog.visible = false;
}

function handleDelete(row: any) {
  const ids = [row.id || state.ids].join(',');
  ElMessageBox.confirm('确认删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteDictTypes(ids).then(() => {
        ElMessage.success('删除成功');
        handleQuery();
      });
    })
    .catch(() => ElMessage.info('已取消删除'));
}

function handleRowClick(row: any) {
  emit('dictClick', row);
}

onMounted(() => {
  handleQuery();
});
</script>
