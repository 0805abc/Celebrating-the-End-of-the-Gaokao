/**
 * 随机内容池 — 组合生成上千条，每次不同
 */
window.GAOKAO_POOLS = (function () {
  'use strict';

  const GEN = window.GAOKAO_GENERATORS;

  function pick(arr, n) {
    const copy = arr.slice();
    const out = [];
    n = Math.min(n, copy.length);
    while (out.length < n) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }

  function pickUnique(arr, n, keyFn) {
    const keyOf = keyFn || (x => (typeof x === 'string' ? x : JSON.stringify(x)));
    const pool = arr.slice();
    const out = [];
    const seen = new Set();
    while (out.length < n && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      const item = pool[i];
      const key = keyOf(item);
      pool.splice(i, 1);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    if (out.length < n) {
      for (const item of arr.slice().sort(() => Math.random() - 0.5)) {
        if (out.length >= n) break;
        const key = keyOf(item);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(item);
        }
      }
    }
    return out;
  }

  function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const thanksUsed = new Set();

  function resetSessionPools() {
    thanksUsed.clear();
  }

  const MEMORIES = GEN.MEMORIES;
  const WEIGHTS = GEN.WEIGHTS;
  const LETTER_PROMPTS = GEN.LETTERS;
  const RELEASE_PHRASES = GEN.RELEASE;
  const CRY_WHISPERS = GEN.WHISPERS;
  const WISHES = GEN.WISHES;

  const THANKS_KEYS = ['父母', '老师', '朋友', '自己'];

  return {
    pick,
    pickUnique,
    pickOne,
    resetSessionPools,
    getMemories: (n = 5) => pickUnique(MEMORIES, n, m => m.text),
    getWeights: (n = 5) => pickUnique(WEIGHTS, n, w => w.label),
    getLetterPrompts: (n = 3) => pickUnique(LETTER_PROMPTS, n),
    getThanks(key) {
      const pool = [...new Set(GEN.getThanks(key))];
      const fresh = pool.filter(t => !thanksUsed.has(t));
      const pickFrom = fresh.length ? fresh : pool;
      const line = pickOne(pickFrom);
      thanksUsed.add(line);
      return line;
    },
    getReleasePhrases: (n = 12) => pickUnique(RELEASE_PHRASES, n),
    getCryWhispers: () => pickUnique(CRY_WHISPERS, 3),
    getWishBubbles: (n = 5) => pickUnique(WISHES, n),
    getWishBatch: (n = 48) => pickUnique(WISHES, n),
    getNarrative: (key, name) => GEN.getNarrative(key, name),
    getWeightIntro(name) {
      return pickOne([
        [`${name}，下面这五样东西，`, '你背了太久太久。', '点一下，把它放在地上。', '不用解释。今晚不用背了。'],
        [`${name}，`, '每一件都曾在夜里压过你。', '现在，把它们轻轻放下。', '一次一件就好。']
      ]);
    },
    getThanksIntro(name) {
      return pickOne([
        [`${name}，回头看——`, '这一路，不是一个人走过来的。', '点一张卡片。把谢谢送出去。'],
        [`${name}，`, '有些人你还没来得及好好说谢谢。', '现在，还来得及。']
      ]);
    },
    getReleaseIntro(name) {
      return pickOne([
        [`${name}，`, '有没有一句话，憋了太久？', '按住按钮。不用真的喊。让心喊。'],
        [`${name}，`, '那些说不出口的，', '都留在心里太久了。', '按住，把它们放走。']
      ]);
    },
    getWishIntro(name) {
      return pickOne([
        [`${name}，`, '天上飘着别人的愿望——', '点一个，或者直接全部放飞。'],
        [`${name}，`, '未来还没来。', '此刻，先许一个愿吧。', '不必完美，真的就行。']
      ]);
    },
    getPenFinalLine(name) {
      return pickOne([
        '—— 答完了。',
        '……就写到这里。',
        '最后一格，填完了。',
        '铃响之前，我停笔了。',
        `${name}，交卷。`,
        '三年，落在这行字上。'
      ]);
    },
    getLetterIntro(name) {
      return pickOne([
        [`${name}，`, '如果只能写一句话——', '给刚刚走出考场的自己。', '你会写什么？'],
        [`${name}，`, '写给那个熬了三年的自己。', '一句就够。']
      ]);
    }
  };
})();
