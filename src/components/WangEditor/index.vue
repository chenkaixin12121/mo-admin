<template>
  <div style="border: 1px solid #ccc">
    <!-- 工具栏 -->
    <Toolbar
      :defaultConfig="toolbarConfig"
      :editor="editorRef"
      :mode="mode"
      style="border-bottom: 1px solid #ccc"
    />
    <!-- 编辑器 -->
    <Editor
      v-model="defaultHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      style="height: 500px; overflow-y: hidden"
      @onChange="handleChange"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, reactive, shallowRef, toRefs} from 'vue';
import {Editor, Toolbar} from '@wangeditor/editor-for-vue';

// API 引用
import {uploadFileApi} from '@/api/file';

const props = defineProps({
  modelValue: {
    type: [String],
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

const state = reactive({
  toolbarConfig: {},
  editorConfig: {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        // 自定义图片上传
        async customUpload(file: any, insertFn: any) {
          console.log('上传图片');
          uploadFileApi(file).then((response) => {
            const url = response.data.url;
            insertFn(url);
          });
        },
      },
    },
  },
  defaultHtml: props.modelValue,
  mode: 'default',
});

const {toolbarConfig, editorConfig, defaultHtml, mode} = toRefs(state);

const handleCreated = (editor: any) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
};

function handleChange(editor: any) {
  emit('update:modelValue', editor.getHtml());
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});
</script>

<style src="@wangeditor/editor/dist/css/style.css"></style>
