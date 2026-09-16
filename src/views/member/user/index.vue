<script lang="ts">
export default {
  name: 'member',
};
</script>

<script lang="ts" setup>
import {reactive, onMounted, toRefs} from 'vue';
import {ElTable} from 'element-plus';
import {Search, Refresh, UserFilled} from '@element-plus/icons-vue';

import {listMemberPages} from '@/api/member/user';
import {Member, MemberQuery} from '@/api/member/user/types';

const state = reactive({
  // 遮罩层
  loading: true,
  // 选中数组
  ids: [] as number[],
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
  listMemberPages(state.queryParams)
    .then(({data}) => {
      state.memberList = data.list;
      state.total = data.total;
    })
    .finally(() => {
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

function handleSelectionChange(selection: Member[]) {
  state.ids = selection.map((item: Member) => item.id);
  state.single = selection.length === 1;
  state.multiple = selection.length > 1;
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
            :placeholder="$t('member.user.memberNickname')"
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
      <el-table
        v-loading="loading"
        :data="memberList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column align="center" type="selection"/>
        <el-table-column align="center" :label="$t('member.user.index')" type="index" width="100"/>
        <el-table-column :label="$t('member.user.nickname')" prop="nickName"/>
        <el-table-column :label="$t('member.user.gender')" width="80">
          <template #default="scope">
            <span v-if="scope.row.gender === 0">{{ $t('common.unknown') }}</span>
            <span v-else-if="scope.row.gender === 1">{{ $t('common.male') }}</span>
            <span v-else-if="scope.row.gender === 2">{{ $t('common.female') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('member.user.avatar')" width="100">
          <template #default="scope">
            <el-popover :width="400" placement="right" trigger="hover">
              <img
                v-if="scope.row.avatarUrl"
                :src="scope.row.avatarUrl"
                height="400"
                width="400"
              />
              <span v-else class="avatar-placeholder">{{ $t('member.user.noAvatar') }}</span>
              <template #reference>
                <img
                  v-if="scope.row.avatarUrl"
                  :src="scope.row.avatarUrl"
                  style="max-height: 60px; max-width: 60px"
                />
                <el-icon v-else :size="24"><UserFilled/></el-icon>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column :label="$t('member.user.mobile')" prop="mobile"/>
        <el-table-column :label="$t('member.user.birthday')" prop="birthday"/>
        <el-table-column :label="$t('common.status')" prop="status" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">{{ $t('common.normal') }}</el-tag>
            <el-tag v-else type="info">{{ $t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('member.user.registerTime')" prop="createTime"/>
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
