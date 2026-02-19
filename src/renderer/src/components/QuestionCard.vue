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
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  max-width: 100%;
}

.question-text {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(205, 198, 247, 0.78);
  margin-bottom: 12px;
  letter-spacing: 0.005em;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(205, 198, 247, 0.06);
  border: 1px solid rgba(205, 198, 247, 0.12);
  border-radius: 10px;
  color: rgba(205, 198, 247, 0.75);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.option-btn:hover:not(:disabled) {
  background: rgba(205, 198, 247, 0.12);
  border-color: rgba(205, 198, 247, 0.22);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(140, 120, 240, 0.2);
}

.option-btn.selected {
  background: rgba(140, 220, 140, 0.12);
  border-color: rgba(140, 220, 140, 0.35);
  color: #b8e6b8;
  box-shadow: 0 4px 16px rgba(140, 220, 140, 0.25);
}

.option-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.option-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-icon {
  color: #8cd48c;
  flex-shrink: 0;
  margin-left: 8px;
}

.custom-section {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.custom-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(205, 198, 247, 0.06);
  border: 1px solid rgba(205, 198, 247, 0.12);
  border-radius: 10px;
  color: rgba(205, 198, 247, 0.8);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.custom-input:focus {
  background: rgba(205, 198, 247, 0.1);
  border-color: rgba(205, 198, 247, 0.25);
  box-shadow: 0 4px 12px rgba(140, 120, 240, 0.2);
}

.custom-input:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.custom-input::placeholder {
  color: rgba(205, 198, 247, 0.35);
}

.custom-submit {
  padding: 10px 18px;
  background: rgba(205, 198, 247, 0.1);
  border: 1px solid rgba(205, 198, 247, 0.18);
  border-radius: 10px;
  color: #cdc6f7;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.custom-submit:hover:not(:disabled) {
  background: rgba(205, 198, 247, 0.16);
  border-color: rgba(205, 198, 247, 0.28);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(140, 120, 240, 0.25);
}

.custom-submit:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}
</style>
