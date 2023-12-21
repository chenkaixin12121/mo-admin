<script lang="ts">
export default {
  name: 'member',
};
</script>

<script lang="ts" setup>
import {reactive, onMounted, toRefs} from 'vue';
import {ElTable} from 'element-plus';
import {Search, Refresh} from '@element-plus/icons-vue';

import {listMemeberPages} from '@/api/member/user';
import {Member, MemberQuery} from '@/api/member/user/types';

const state = reactive({
  // 遮罩层
  loading: true,
  // 选中数组
  ids: [],
  // 非单个禁用
  single: true,
  // 非多个禁用
  multiple: true,
  total: 0,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
  } as MemberQuery,
  memberList: [] as Member[],
});

const {loading, queryParams, memberList, total} = toRefs(state);

function handleQuery() {
  state.loading = true;
  listMemeberPages(state.queryParams).then(({data}) => {
    state.memberList = data.list;
    state.total = data.total;
    state.loading = false;
  });
}

function resetQuery() {
  state.queryParams = {
    pageNum: 1,
    pageSize: 10,
    keywords: '',
  };
  handleQuery();
}

function handleSelectionChange(selection: any) {
  state.ids = selection.map((item: { id: any }) => item.id);
  state.single = selection.length != 1;
  state.multiple = !selection.length;
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
    <div class="search">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams">
        <el-form-item>
          <el-input
            v-model="queryParams.keywords"
            clearable
            placeholder="会员昵称"
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
      <el-table
        v-loading="loading"
        :data="memberList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column align="center" type="selection"/>
        <el-table-column align="center" label="序号" type="index" width="100"/>
        <el-table-column label="昵称" prop="nickName"/>
        <el-table-column label="性别" width="80">
          <template #default="scope">
            <span v-if="scope.row.gender === 0">未知</span>
            <span v-if="scope.row.gender === 1">男</span>
            <span v-if="scope.row.gender === 2">女</span>
          </template>
        </el-table-column>
        <el-table-column label="头像" width="100">
          <template #default="scope">
            <el-popover :width="400" placement="right" trigger="hover">
              <img :src="scope.row.avatarUrl" height="400" width="400"/>
              <template #reference>
                <img
                  :src="scope.row.avatarUrl"
                  style="max-height: 60px; max-width: 60px"
                />
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="手机号码" prop="mobile"/>
        <el-table-column label="出生日期" prop="birthday"/>
        <el-table-column label="状态" prop="status" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" prop="createTime"/>
      </el-table>
    </el-card>

    <!-- 分页工具条 -->
    <pagination
      v-if="total > 0"
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNum"
      :total="total"
      @pagination="handleQuery"
    />
  </div>
</template>

<style scoped></style>
