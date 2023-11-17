<!--
  多图上传组件
  @author: haoxr
  @date 2022/11/20
  @link https://element-plus.gitee.io/zh-CN/component/upload.html
-->

<template>
  <el-upload
    v-model:file-list="fileList"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :limit="props.limit"
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    list-type="picture-card"
  >
    <el-icon>
      <Plus/>
    </el-icon>
  </el-upload>

  <el-dialog v-model="dialogVisible">
    <img :src="dialogImageUrl" alt="Preview Image" w-full/>
  </el-dialog>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue';
import {Plus} from '@element-plus/icons-vue';
import {
  ElMessage,
  ElUpload,
  UploadFile,
  UploadProps,
  UploadRawFile,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';
import {deleteFileApi, uploadFileApi} from '@/api/file';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  /**
   * 文件路径集合
   */
  modelValue: {
    type: Array < string >,
    default: [] as Array<string>,
  },
  /**
   * 文件上传数量限制
   */
  limit: {
    type: Number,
    default: 5,
  },
});

const dialogImageUrl = ref('');
const dialogVisible = ref(false);

const fileList = ref([] as UploadUserFile[]);
watch(
  () => props.modelValue,
  (newVal: string[]) => {
    console.log('newVal', newVal);
    const filePaths = fileList.value.map((file) => file.url);
    // 监听modelValue文件集合值未变化时，跳过赋值
    if (
      filePaths.length > 0 &&
      filePaths.length === newVal.length &&
      filePaths.every((x) => newVal.some((y) => y === x)) &&
      newVal.every((y) => filePaths.some((x) => x === y))
    ) {
      return;
    }

    fileList.value = newVal.map((filePath) => {
      return {url: filePath} as UploadUserFile;
    });
  },
  {immediate: true}
);

/**
 * 自定义图片上传
 *
 * @param params
 */
async function handleUpload(options: UploadRequestOptions): Promise<any> {
  const {data: fileInfo} = await uploadFileApi(options.file);

  // 上传成功需手动替换文件路径为远程URL，否则图片地址为预览地址 blob:http://
  const fileIndex = fileList.value.findIndex(
    (file) => file.uid == (options.file as any).uid
  );

  fileList.value.splice(fileIndex, 1, {
    name: fileInfo.name,
    url: fileInfo.url,
  } as UploadUserFile);

  emit(
    'update:modelValue',
    fileList.value.map((file) => file.url)
  );
}

/**
 * 删除图片
 */
function handleRemove(removeFile: UploadFile) {
  const filePath = removeFile.url;

  if (filePath) {
    deleteFileApi(filePath).then(() => {
      emit(
        'update:modelValue',
        fileList.value.map((file) => file.url)
      );
    });
  }
}

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload(file: UploadRawFile) {
  if (file.size > 2 * 1048 * 1048) {
    ElMessage.warning('上传图片不能大于2M');
    return false;
  }
  return true;
}

/**
 * 图片预览
 */
const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!;
  dialogVisible.value = true;
};
</script>
