<script setup lang="ts">
useHead({ title: 'Webゲーム' })

const questions = [
  {
    question: 'Webページの「見た目」を整える言語は？',
    choices: ['HTML', 'CSS', 'SQL'],
    answer: 1,
    explanation: 'CSSは、文字の色や大きさ、レイアウトなどを決めるための言語です。',
  },
  {
    question: 'コンピューターが扱う「1バイト」は何ビット？',
    choices: ['2ビット', '8ビット', '100ビット'],
    answer: 1,
    explanation: '1バイトは8ビット。0と1の組み合わせで、256通りの値を表せます。',
  },
  {
    question: 'プログラムの「バグ」とは？',
    choices: ['プログラムの不具合', 'ゲームの主人公', 'パソコンの部品'],
    answer: 0,
    explanation: '意図した動きにならない原因を「バグ」と呼びます。見つけて直す作業がデバッグです。',
  },
]

const questionIndex = ref(0)
const selection = ref<number | null>(null)
const score = ref(0)
const complete = ref(false)
const question = computed(() => questions[questionIndex.value]!)
const questionHeading = ref<HTMLElement | null>(null)

function answer(index: number) {
  if (selection.value !== null) return
  selection.value = index
  if (index === question.value.answer) score.value++
}

async function next() {
  if (questionIndex.value === questions.length - 1) {
    complete.value = true
  } else {
    questionIndex.value++
    selection.value = null
  }
  // 問題が切り替わったことをキーボード・読み上げ利用者にも伝える。
  await nextTick()
  questionHeading.value?.focus()
}

async function restart() {
  questionIndex.value = 0
  selection.value = null
  score.value = 0
  complete.value = false
  await nextTick()
  questionHeading.value?.focus()
}
</script>

<template>
  <div class="page-content stack games-page">
    <PageHeading
      eyebrow="PLAY WITH KCS"
      title="ひらめきクイズ"
      description="待ち時間に、ちょっと頭の体操。"
    />

    <section class="card quiz-card" aria-labelledby="question-heading">
      <template v-if="!complete">
        <span class="chip progress-chip"
          >QUESTION {{ questionIndex + 1 }} / {{ questions.length }}</span
        >
        <h2 id="question-heading" ref="questionHeading" tabindex="-1">{{ question.question }}</h2>
        <div class="choices" role="group" aria-label="答えを選ぶ">
          <button
            v-for="(choice, index) in question.choices"
            :key="choice"
            type="button"
            class="choice-button"
            :class="{
              chosen: selection === index,
              correct: selection !== null && index === question.answer,
            }"
            :disabled="selection !== null"
            @click="answer(index)"
          >
            <span class="choice-marker">{{ ['A', 'B', 'C'][index] }}</span>
            <span>{{ choice }}</span>
            <span v-if="selection !== null && index === question.answer" class="answer-mark"
              >正解</span
            >
          </button>
        </div>
        <div v-if="selection !== null" class="answer-feedback" role="status">
          <strong>{{ selection === question.answer ? '正解！' : 'おしい！' }}</strong>
          <p>{{ question.explanation }}</p>
        </div>
        <button v-if="selection !== null" class="primary-button" type="button" @click="next">
          {{ questionIndex === questions.length - 1 ? '結果を見る' : '次の問題へ' }}
        </button>
      </template>
      <template v-else>
        <span class="chip progress-chip">CLEAR!</span>
        <h2 id="question-heading" ref="questionHeading" tabindex="-1">
          {{ questions.length }}問中 {{ score }}問 正解！
        </h2>
        <p class="quiz-result">
          {{
            score === questions.length
              ? 'おみごと！コンピューターに詳しいね。'
              : '遊んでくれてありがとう！新しい発見はあったかな？'
          }}
        </p>
        <NuxtLink to="/exhibitions" class="primary-button">KCSの作品を見てみる</NuxtLink>
        <button type="button" class="secondary-button" @click="restart">もう一度遊ぶ</button>
      </template>
    </section>
    <NuxtLink to="/" class="back-link">会場マップへ戻る →</NuxtLink>
  </div>
</template>

<style scoped>
.games-page {
  gap: 16px;
}
.quiz-card {
  display: grid;
  gap: 20px;
  padding: 20px;
}
.progress-chip {
  justify-self: start;
  background: var(--kcs-lavender, #e5dcf9);
}
.quiz-card h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.6;
}
.quiz-card h2:focus {
  outline: none;
}
.choices {
  display: grid;
  gap: 10px;
}
.choice-button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 12px;
  border: 1px solid var(--kcs-line, #ead6c5);
  border-radius: 12px;
  background: var(--kcs-paper, #fff6ea);
  text-align: left;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.choice-button:disabled {
  opacity: 1;
  cursor: default;
}
.choice-button.chosen {
  border-color: var(--kcs-orange, #ee8b4a);
}
.choice-button.correct {
  background: var(--kcs-mint, #d5e9d5);
}
.choice-marker {
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: white;
}
.answer-mark {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.answer-feedback {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.answer-feedback p,
.quiz-result {
  margin: 0;
  color: var(--kcs-muted, #7d5b49);
  font-size: 12px;
  line-height: 1.7;
}
.back-link {
  min-height: 44px;
  display: grid;
  place-items: center;
  font-size: 12px;
}
</style>
