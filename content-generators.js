/**
 * 组合式文案生成 — 每次打开组合不同，规模上千
 */
window.GAOKAO_GENERATORS = (function () {
  'use strict';

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const pickN = (arr, n) => {
    const c = arr.slice();
    const o = [];
    while (o.length < n && c.length) {
      const i = Math.floor(Math.random() * c.length);
      o.push(c.splice(i, 1)[0]);
    }
    return o;
  };

  const uniq = arr => [...new Set(arr)];

  function genWishes() {
    const a = ['安稳', '温柔', '明亮', '自由', '踏实', '轻盈', '炽热', '安静', '辽阔', '柔软'];
    const n = ['夏天', '夜晚', '清晨', '旅途', '重逢', '笑声', '晚霞', '星空', '海风', '勇气'];
    const v = ['遇见', '拥有', '留住', '拥抱', '遇见', '守护', '感受', '成为'];
    const act = [
      '睡一个没有闹钟的觉', '吃一碗热汤面', '看一场日落', '听完一张专辑',
      '和朋友彻夜聊天', '去海边踩沙子', '淋一场夏天的雨', '养一盆会开花的东西',
      '给喜欢的人发一句你好', '在操场上走一圈', '删掉让你焦虑的软件一天',
      '对自己说一句辛苦了', '买一束花放在桌上', '看一部老电影', '学做一道会成功的菜'
    ];
    const out = [...act];
    for (let i = 0; i < 800; i++) out.push(`${v[i % v.length]}一个${pick(a)}的${pick(n)}`);
    for (let i = 0; i < 600; i++) out.push(`愿${pick(a)}常伴`);
    for (let i = 0; i < 500; i++) out.push(`愿每一次${pick(n)}都值得`);
    return uniq(out);
  }

  function genMemories() {
    const years = ['高一 · 秋', '高一 · 冬', '高二 · 春', '高二 · 夏', '高三 · 一模', '高三 · 百日前', '高三 · 凌晨', '今天 · 考场', '今天 · 门口'];
    const seeds = [
      '你曾在草稿纸上画过无数个小人，它们是你偷偷喘气的证据。',
      '某次罚站，你看着窗外发呆，其实什么也没想，只是累了。',
      '后排风扇吱呀转了一夏天，你竟有点想念那个声音。',
      '你记得某道题做了七遍还是错，第八遍终于对了。',
      '体育课被占的那天，全班唉声叹气，后来却成了常态。',
      '你有过一次在厕所里偷偷哭，出来洗了把脸继续回去做题。',
      '某次进步很小，你却高兴了一晚上，因为终于不是原地踏步。',
      '你曾在志愿表上填了又改，改了又填，像在选择另一种人生。',
      '铃声响起时，你愣了一秒——原来真的结束了。',
      '走出校门那刻，你不知该笑还是该哭，最后只是深呼吸。'
    ];
    const when = ['某节自习', '一次月考后', '午休的教室', '下雨的傍晚', '冬天早读', '晚自习后', '一模前夜', '校运会那天', '放榜那天', '毕业前一周'];
    const what = [
      '你把脸埋进臂弯，假装睡着',
      '你和同桌对视一眼，什么都没说',
      '你第一次觉得，原来也会害怕',
      '你把错题本合上，发了很久的呆',
      '你偷偷把喜欢的歌又听了一遍',
      '你望着黑板发呆，粉笔灰在光里飘',
      '你给自己买了一杯奶茶，算犒劳',
      '你删了又写，写了一句「我可以」',
      '你把书包理得很整齐，像告别什么',
      '你站在走廊，风从操场吹过来'
    ];
    const out = [];
    const seen = new Set();
    const add = (year, text) => {
      if (seen.has(text)) return;
      seen.add(text);
      out.push({ year, text });
    };
    seeds.forEach((text, i) => add(years[i % years.length], text));
    when.forEach((w, i) => add(pick(years), `${w}，${what[i % what.length]}。`));
    what.forEach((w, i) => add(pick(years), `${pick(when)}，${w}。`));
    for (let i = 0; i < 600; i++) {
      add(pick(years), `${pick(when)}，${pick(what)}。`);
    }
    return out;
  }

  function genWeights() {
    const labels = ['成绩单', '排名', '期待', '失眠', '比较', '自责', '焦虑', '沉默', '倔强', '疲惫'];
    const stories = [
      '你把它压在书包最底层，像压住一声叹息。',
      '它不重，但你背了太久，久到忘了还能放下。',
      '你从没跟人细说，只是每次想起都胸口发紧。',
      '今晚不必再证明什么，它可以先放在地上。',
      '你曾以为离不开它，其实你只是习惯了。',
      '它不是你的全部，只是三年里太吵的那一部分。',
      '它曾是你每天醒来的第一个念头。',
      '你背着它走进考场，也背着它走出校门。',
      '你怕别人看见，所以把它藏得很好。',
      '你早就想放下，只是不知道手该怎么松。'
    ];
    const out = [];
    const seen = new Set();
    labels.forEach(label => {
      const story = pick(stories);
      const key = `${label}|${story}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ label, story });
      }
    });
    for (let i = 0; i < 200; i++) {
      const label = pick(labels);
      const story = pick(stories);
      const key = `${label}|${story}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ label, story });
    }
    return out;
  }

  function genLetters() {
    const p = ['辛苦了', '对不起', '谢谢你', '没关系', '你已经够了', '慢慢来', '我在', '别怕', '值得', '真好'];
    const s = ['真的', '今晚', '对自己', '这一次', '无论如何', '先休息', '会好的', '我懂'];
    const out = [];
    for (let i = 0; i < 500; i++) out.push(`${pick(p)}，${pick(s)}。`);
    return uniq(out);
  }

  function genThanks(cat) {
    const pools = {
      父母: ['那句没说出口的担心，我后来才听懂。', '送考那天，你们站在人群里，像两座安静的山。', '饭菜的热气，比任何加油都实在。', '你们也许笨拙，但爱从不缺席。', '你们没问成绩，只问饿不饿。', '门口那盏灯，总是为你留着。'],
      老师: ['那道题你讲了三遍，第三遍我才听懂，但听懂了。', '批评背后，是希望我走得更远。', '黑板上的字会被擦掉，那句话不会。', '你也曾年轻，也懂我们的难。', '你递来的卷子，有时比话更暖。', '你严厉的那面，后来都成了感谢。'],
      朋友: ['半块橡皮，一张纸条，都是青春的货币。', '一起骂过的早读，后来都成了笑谈。', '你没说多少加油，但一直在旁边。', '那些一起熬的夜，比分数更真。', '你递过来的笔记，字迹乱七八糟却救命。', '考完后第一句，你发的是「出来没」。'],
      自己: ['最难的时候，是你把自己从深渊边拉回来。', '你没有成为完美的人，但成为了坚持的人。', '你比自己想象的更勇敢。', '这三年，辛苦了，真的。', '你无数次想逃，又无数次坐回来。', '你值得被好好抱一抱。']
    };
    return pools[cat] || pools['自己'];
  }

  function genRelease() {
    const a = ['我受够了', '我已经尽力', '让我休息', '放过我', '够了', '我不想再怕', '我值得被爱', '我会好起来'];
    const b = ['真的', '了', '一下', '一会儿', '吧', '……'];
    const out = [];
    for (let i = 0; i < 300; i++) out.push(`${pick(a)}${pick(b)}`);
    return uniq(out);
  }

  function genWhispers() {
    return [
      '哭吧，没人看见。',
      '身体从不说谎，眼泪也是勇气。',
      '你已经撑得太久。',
      '碎一会儿，没关系。',
      '今晚，允许自己软下来。',
      '不用解释，不用坚强。',
      '这三年的委屈，可以流出来一点。',
      '你做得很好了，真的。',
      '没人会笑你，这里只有你自己。',
      '让眼泪把盐冲走，哪怕一点点。'
    ];
  }

  function genNarrative(key, name) {
    const pools = {
      cover: [
        ['卷子上还留着手汗的味道。', '不管最后得多少分——', '你都已经从那个考场，走出来了。'],
        ['六月的风从窗外吹进来。', '这一次，没有下一题了。', '你走出了那个房间。'],
        ['三年压缩成两天。', '现在，钟表的指针终于属于你了。', '先喘口气，其他的慢慢来。']
      ],
      door: [
        [`${name}，听——`, '监考老师收起最后一张卷子。', '铃声响了。周围有人在哭，有人在笑。', '你站起来。腿有点麻。', '按住屏幕，把门推开。'],
        [`${name}，`, '最后一科结束的那一秒，', '教室里安静得不太真实。', '你握着笔的手，终于松了一点。', '门就在前面。推开它。']
      ],
      pen: [
        [`${name}，`, '卷面上，最后一行字已经写完。', '下面那支笔——陪了你整整三年。', '它不用再握着了。', '点「让它休息」。'],
        [`${name}，`, '中指侧面的茧，是它留下的印记。', '现在，考结束了。', '让那支笔，也歇一歇吧。'],
        [`${name}，`, '它陪你看过无数错题和深夜。', '今天，它终于可以不动了。', '轻轻点一下，送它休息。']
      ],
      cry: [
        [`${name}……`, '走出考场那一刻，有没有一瞬间', '突然什么都不想说？', '或者，眼眶一下子就热了？', '这里没有别人。', '你可以不用坚强。'],
        [`${name}，`, '如果此刻你想哭——', '那不是软弱。', '是这三年的重量，', '终于找到了一个出口。']
      ],
      final: [
        [`${name}，欢迎回来。`, '不是回到书桌前。', '是回到——可以做自己的那个你。', '成绩会来。但今晚，', '你值得好好睡一觉，做一场没有闹钟的梦。'],
        [`${name}，`, '十个仪式走完了。', '你不需要再证明什么。', '明天太阳还会升起。', '而今晚——属于你。']
      ]
    };
    return pick(pools[key] || pools.cover);
  }

  return {
    WISHES: genWishes(),
    MEMORIES: genMemories(),
    WEIGHTS: genWeights(),
    LETTERS: genLetters(),
    RELEASE: genRelease(),
    WHISPERS: genWhispers(),
    getThanks: genThanks,
    getNarrative: genNarrative
  };
})();
