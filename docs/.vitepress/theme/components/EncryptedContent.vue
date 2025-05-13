<script setup>
import { ref, onMounted, computed } from "vue";
import CryptoJS from "crypto-js";
import MarkdownIt from "markdown-it";

const props = defineProps({
  encrypted: String,
  password: String,
  renderMarkdown: Boolean,
});

const passwordInput = ref("");
const decryptedContent = ref("");
const showModal = ref(false);
const error = ref(false);

const STORAGE_KEY = "vitepress_encryption_cache";
const EXPIRY_HOURS = 2;

function savePassword(pass) {
  const data = { pass, time: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPassword() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return null;
  try {
    const { pass, time } = JSON.parse(json);
    if (Date.now() - time > EXPIRY_HOURS * 3600 * 1000) return null;
    return pass;
  } catch {
    return null;
  }
}

function tryDecrypt(pass) {
  try {
    const bytes = CryptoJS.AES.decrypt(props.encrypted, pass);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error("fail");
    decryptedContent.value = decrypted;
    savePassword(pass);
    error.value = false;
    showModal.value = false;
  } catch (e) {
    error.value = true;
  }
}

onMounted(() => {
  const autoPwd = props.password || loadPassword();
  if (autoPwd) {
    tryDecrypt(autoPwd);
  }
});

const rendered = computed(() => {
  const md = new MarkdownIt();
  return props.renderMarkdown
    ? md.render(decryptedContent.value)
    : decryptedContent.value;
});

function closeModal() {
  showModal.value = false;
}
</script>

<template>
  <!-- <div class="encrypted-wrapper"> -->
  <div v-if="!decryptedContent">
    <!-- <div class="content-preview">
        <slot /> -->
    <!-- 前50行Markdown内容在插槽中 -->
    <!-- <div class="fadeout" /> -->
    <!-- </div> -->
    <button class="view-btn" @click="showModal = true">🔐 查看完整内容</button>
  </div>

  <div v-else v-html="rendered" class="decrypted-content" />

  <!-- 弹出输入密码框 -->
  <div class="modal-mask" v-if="showModal" @click.self="closeModal">
    <div class="modal">
      <h3>请输入密码</h3>
      <input
        v-model="passwordInput"
        type="password"
        @keyup.enter="tryDecrypt(passwordInput)"
        placeholder="密码"
      />
      <div class="buttons">
        <button @click="tryDecrypt(passwordInput)">确定</button>
        <button @click="closeModal">取消</button>
      </div>
      <p v-if="error" class="error">密码错误，请重试。</p>
    </div>
  </div>
  <!-- </div> -->
</template>

<style scoped>
/* .encrypted-wrapper {
  position: relative;
  margin: 1.5em 0;
} */
/* .content-preview {
  position: relative;
  max-height: 400px;
  overflow: hidden;
  border: 1px dashed #aaa;
  padding: 1em;
} */
.fadeout {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4em;
  width: 100%;
  background: linear-gradient(to top, white, transparent);
}
.view-btn {
  margin-top: 1em;
  padding: 0.5em 1em;
  cursor: pointer;
  font-weight: bold;
}
/* .decrypted-content {
  border: 1px dashed #4caf50;
  padding: 1em;
  background: #f9fff9;
} */

/* 模态框 */
.modal-mask {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  padding: 1.5em;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  min-width: 300px;
}
.modal input {
  width: 100%;
  padding: 0.5em;
  margin-top: 0.5em;
}
.buttons {
  margin-top: 1em;
  text-align: right;
}
.buttons button {
  margin-left: 0.5em;
}
.error {
  color: red;
  margin-top: 0.5em;
}
</style>
