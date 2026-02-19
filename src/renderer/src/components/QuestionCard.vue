<script setup>
import { ref } from 'vue'
import { Check } from 'lucide-vue-next'

const props = defineProps({
  question: String,
  options: Array,
  allowCustom: Boolean,
  customPlaceholder: String
})

const emit = defineEmits(['answer'])

const selectedIndex = ref(null)
const customInput = ref('')
const isAnswered = ref(false)

function selectOption(index, optionText) {
  if (isAnswered.value) return

  selectedIndex.value = index
  isAnswered.value = true

  emit('answer', {
    answer: optionText,
    isCustom: false,
    selectedIndex: index
  })
}

function submitCustom() {
  if (isAnswered.value || !customInput.value.trim()) return

  isAnswered.value = true

  emit('answer', {
    answer: customInput.value.trim(),
    isCustom: true
  })
}
</script>

<template>
  <div class="question-card">
    <div class="question-text">{{ question }}</div>

    <div class="options-grid">
      <button
        v-for="(option, index) in options"
        :key="index"
        class="option-btn"
        :class="{
          selected: selectedIndex === index,
          disabled: isAnswered && selectedIndex !== index
        }"
        :disabled="isAnswered"
        @click="selectOption(index, option)"
      >
        <span class="option-text">{{ option }}</span>
        <Check v-if="selectedIndex === index" :size="16" class="check-icon" />
      </button>
    </div>

    <div v-if="allowCustom" class="custom-section">
      <input
        v-model="customInput"
        type="text"
        class="custom-input"
        :placeholder="customPlaceholder"
        :disabled="isAnswered"
        @keydown.enter="submitCustom"
      />
      <button
        class="custom-submit"
        :disabled="isAnswered || !customInput.trim()"
        @click="submitCustom"
      >
        Submit
      </button>
    </div>
  </div>
</template>

<style scoped>
.question-card {
  background: rgba(205, 198, 247, 0.06);
  border: 1px solid rgba(205, 198, 247, 0.12);
  border-radius: 16px;
  padding: 18px;
  margin: 12px 0;
  max-width: 90%;
}

.question-text {
  font-size: 15px;
  font-weight: 500;
  color: #e0daf7;
  margin-bottom: 14px;
  line-height: 1.5;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(205, 198, 247, 0.15);
  border-radius: 10px;
  color: rgba(205, 198, 247, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  background: rgba(205, 198, 247, 0.1);
  border-color: rgba(205, 198, 247, 0.25);
  transform: translateX(2px);
}

.option-btn.selected {
  background: rgba(140, 220, 140, 0.15);
  border-color: rgba(140, 220, 140, 0.4);
  color: #b8e6b8;
}

.option-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option-text {
  flex: 1;
}

.check-icon {
  color: #8cd48c;
  flex-shrink: 0;
}

.custom-section {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(205, 198, 247, 0.08);
}

.custom-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(205, 198, 247, 0.15);
  border-radius: 8px;
  color: rgba(205, 198, 247, 0.8);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.2s;
}

.custom-input:focus {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(205, 198, 247, 0.3);
}

.custom-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.custom-input::placeholder {
  color: rgba(205, 198, 247, 0.3);
}

.custom-submit {
  padding: 10px 20px;
  background: rgba(205, 198, 247, 0.12);
  border: 1px solid rgba(205, 198, 247, 0.2);
  border-radius: 8px;
  color: #cdc6f7;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.custom-submit:hover:not(:disabled) {
  background: rgba(205, 198, 247, 0.18);
  border-color: rgba(205, 198, 247, 0.3);
}

.custom-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
