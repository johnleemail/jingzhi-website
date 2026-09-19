/* ==========================================================================
   上海精智实业股份有限公司 · 官网交互
   ========================================================================== */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 加载动画 ---------- */
  const loader = document.getElementById('loader');
  // 调试参数：?noloader 直接跳过加载动画
  if (new URLSearchParams(location.search).has('noloader')) {
    loader && loader.classList.add('done');
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => loader && loader.classList.add('done'), 450);
    });
    // 兜底：3.5s 后强制隐藏
    setTimeout(() => loader && loader.classList.add('done'), 3500);
  }

  /* ---------- 星空背景 ---------- */
  (function starfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    let stars = [];
    let shooting = null;
    let w, h, dpr;
    let raf = null;
    let visible = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function buildStars() {
      const count = Math.min(150, Math.round((w * h) / 11000));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.3,
          a: Math.random() * 0.6 + 0.15,
          tw: Math.random() * 0.012 + 0.004,
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    function spawnShooting() {
      shooting = {
        x: Math.random() * w * 0.7 + w * 0.2,
        y: Math.random() * h * 0.35,
        len: Math.random() * 120 + 90,
        speed: Math.random() * 7 + 7,
        life: 1,
        angle: Math.PI * (0.72 + Math.random() * 0.12),
      };
    }

    function draw(t) {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);

      // 星星
      for (const s of stars) {
        const alpha = s.a * (0.6 + 0.4 * Math.sin(t * s.tw * 100 + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(190, 215, 245,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }

      // 流星
      if (!shooting && Math.random() < 0.005) spawnShooting();
      if (shooting) {
        const dx = Math.cos(shooting.angle) * shooting.speed;
        const dy = Math.sin(shooting.angle) * shooting.speed;
        shooting.x += dx;
        shooting.y += dy;
        shooting.life -= 0.012;
        const tailX = shooting.x - Math.cos(shooting.angle) * shooting.len;
        const tailY = shooting.y - Math.sin(shooting.angle) * shooting.len;
        const grad = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
        grad.addColorStop(0, 'rgba(255,255,255,' + Math.max(shooting.life, 0) + ')');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        if (shooting.life <= 0 || shooting.x > w + 200 || shooting.y > h + 200) {
          shooting = null;
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function pause() {
      visible = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    function resume() {
      if (visible || prefersReducedMotion) return;
      visible = true;
      raf = requestAnimationFrame(draw);
    }

    resize();
    if (prefersReducedMotion) {
      buildStars();
      const t0 = performance.now();
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(190, 215, 245,' + s.a.toFixed(3) + ')';
        ctx.fill();
      }
    } else {
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    // 离开视口或标签页隐藏时暂停
    document.addEventListener('visibilitychange', () => {
      document.hidden ? pause() : resume();
    });
    new IntersectionObserver(
      (entries) => (entries[0].isIntersecting ? resume() : pause()),
      { threshold: 0 }
    ).observe(hero);
  })();

  /* ---------- 导航状态 ---------- */
  const nav = document.getElementById('nav');
  const navProgress = document.getElementById('navProgress');
  const backTop = document.getElementById('backTop');

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    backTop.classList.toggle('show', y > 800);

    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    if (navProgress && max > 0) {
      navProgress.style.width = Math.min((y / max) * 100, 100) + '%';
    }
    scrollSpy(y);
  }

  /* ---------- 滚动侦测（导航高亮） ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const spySections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function scrollSpy(y) {
    let currentId = spySections[0] ? spySections[0].id : null;
    for (const sec of spySections) {
      if (y >= sec.offsetTop - 160) currentId = sec.id;
    }
    // 滚动到底部时高亮最后一个
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 60) {
      currentId = spySections[spySections.length - 1].id;
    }
    navLinks.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');

  function setMenu(open) {
    burger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setMenu(false));
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- 滚动显现 ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const debugMode = new URLSearchParams(location.search).has('noloader');
  if (debugMode || prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // 兜底：1.2s 后仍处于视口内却未显现的元素，强制显示
    setTimeout(() => {
      const vh = window.innerHeight;
      revealEls.forEach((el) => {
        if (el.classList.contains('visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) el.classList.add('visible');
      });
    }, 1200);
  }

  /* ---------- 数字滚动 ---------- */
  const counters = document.querySelectorAll('.counter');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach((c) => (c.textContent = c.dataset.target));
  } else {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          counterIO.unobserve(entry.target);
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const dur = 1800;
          const t0 = performance.now();
          function tick(now) {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => counterIO.observe(c));
  }

  /* ---------- 制造能力 Tab ---------- */
  const capTabs = Array.from(document.querySelectorAll('.cap-tab'));
  const capPanels = Array.from(document.querySelectorAll('.cap-panel'));

  function switchTab(idx) {
    capTabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    capPanels.forEach((p, i) => p.classList.toggle('active', i === idx));
  }
  capTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(parseInt(tab.dataset.tab, 10)));
  });

  // 业务板块卡片 → 跳转对应能力 Tab
  document.querySelectorAll('.sol-card[data-tab]').forEach((card) => {
    card.addEventListener('click', (e) => {
      const idx = parseInt(card.dataset.tab, 10);
      switchTab(idx);
      const target = document.getElementById('capability');
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }, 60);
      }
    });
  });

  /* ---------- 横向滚动控制 ---------- */
  document.querySelectorAll('.scroller-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = document.getElementById('factoryTrack');
      const dir = parseInt(btn.dataset.dir, 10);
      track.scrollBy({ left: dir * 400, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 视频播放 ---------- */
  const video = document.getElementById('aiVideo');
  const videoPlay = document.getElementById('videoPlay');
  const videoFrame = video && video.closest('.video-frame');

  if (video && videoPlay && videoFrame) {
    const play = () => {
      videoFrame.classList.add('playing');
      video.play().catch(() => {});
    };
    videoPlay.addEventListener('click', play);
    video.addEventListener('ended', () => videoFrame.classList.remove('playing'));
    video.addEventListener('pause', () => {
      if (video.paused && !video.ended) videoFrame.classList.remove('playing');
    });
  }

  /* ---------- 返回顶部 ---------- */
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
})();


/* ==========================================================================
   数字人 · 小沃（对话助手）
   ========================================================================== */
(function () {
  'use strict';

  const dh = document.getElementById('digitalHuman');
  if (!dh) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const btn = document.getElementById('dhBtn');
  const panel = document.getElementById('dhPanel');
  const closeBtn = document.getElementById('dhClose');
  const badge = document.getElementById('dhBadge');
  const voiceBtn = document.getElementById('dhVoice');
  const body = document.getElementById('dhBody');
  const chips = document.getElementById('dhChips');
  const input = document.getElementById('dhInput');
  const sendBtn = document.getElementById('dhSend');
  const typingEl = document.createElement('div');
  typingEl.className = 'dh-typing';
  typingEl.hidden = true;
  typingEl.innerHTML = '<span></span><span></span><span></span>';

  let opened = false;
  let voiceOn = false;
  let busy = false;

  /* ---------- 知识库（脱敏口径） ---------- */
  const KB = [
    {
      keys: ['你好', '您好', 'hi', 'hello', '嗨', '在吗', '早上好', '下午好', '晚上好'],
      reply: '您好！我是数字人「小沃」，由蓝沃AI驱动，很高兴为您服务。\n关于精智的公司介绍、业务板块、工业AI、资质荣誉或联系方式，您都可以问我，也可以点击下面的快捷问题。',
    },
    {
      keys: ['公司', '精智', '介绍', '是谁', '什么公司', '概况', '历史', '发展'],
      reply: '上海精智实业股份有限公司创立于2006年，是上海市首批大学生科技创业基金扶持的创业企业，总部位于上海杨浦滨江。\n公司是以「AI+制造」为核心驱动力的智能制造综合系统解决方案提供商，深耕汽车、通信、机器人及新能源等先进制造领域20年，将工业AI技术与先进装备、精密零部件和通讯热管理等实体业务深度融合。',
      actions: [{ label: '查看公司介绍', target: '#about' }],
    },
    {
      keys: ['业务', '板块', '主营', '产品', '方案', '解决'],
      reply: '精智拥有六大业务板块：\n① 工艺装备——模具、夹具、量检具、淬火感应器\n② 智能信息装备——装配、检测、追溯与产线集成\n③ 精密金属量产——汽车传动精密零部件\n④ 塑胶科技——精密齿轮与传动组件\n⑤ 通讯热管理——散热器、结构件\n⑥ 工业AI与数字化——蓝沃AI智能体\n可按项目需要灵活组合交付。',
      actions: [
        { label: '查看业务板块', target: '#solutions' },
        { label: '查看制造能力', target: '#capability' },
      ],
    },
    {
      keys: ['工业ai', '蓝沃', '人工智能', '智能体', '排产', '调度', '工艺优化', '执行监控', 'ai'],
      reply: '蓝沃AI（Level AI）是精智旗下工业AI品牌，由上市制造企业孵化，提供三大智能体：\n· 产能调度智能体「沃慧排」——秒级排产、一键插单\n· 执行监控智能体——视觉识别辅助现场管理\n· 工艺优化智能体——图纸解析生成工艺路线\n其中产能调度与执行监控智能体已实现对外销售。',
      actions: [
        { label: '了解工业AI', target: '#ai' },
        { label: '蓝沃AI官网', href: 'https://www.level-ai.cn' },
      ],
    },
    {
      keys: ['装备', '模具', '夹具', '检具', '产线', '装配'],
      reply: '先进装备是精智的核心业务：\n· 工艺装备：温锻/冷挤压/旋锻模具、量检具、试验工装、淬火感应器\n· 智能信息装备：汽车差速器、EPS转向、线控制动、悬架装配检测线，以及机器人关节模组智能装备\n2025年「汽车传动轴装备模具」入选上海市制造业单项冠军。',
      actions: [{ label: '查看制造能力', target: '#capability' }],
    },
    {
      keys: ['塑胶', '塑料', '注塑', '齿轮'],
      reply: '塑胶科技板块提供精密齿轮、蜗轮、壳体、阀芯与传动组件，覆盖齿轮设计、模流分析、NVH模拟、注塑成型与功能验证。\n应用包括天窗/进气格栅/空调出风口执行器齿轮组、EPB驱动器、隐藏式门把手传动系统等；面向机器人应用的高精度塑胶产品已批量交付。',
      actions: [{ label: '查看制造能力', target: '#capability' }],
    },
    {
      keys: ['热管理', '散热', '通讯', '储能', '新能源'],
      reply: '通讯热管理板块面向通讯、新能源及消费电子场景，提供散热器总成、散热箱体、屏蔽盖及压铸结构件，覆盖液冷散热、嵌热管等工艺，业务正由通讯场景向储能等领域延伸。',
      actions: [{ label: '查看制造能力', target: '#capability' }],
    },
    {
      keys: ['资质', '荣誉', '认证', '证书', 'iso', 'iatf', '小巨人', '冠军'],
      reply: '精智的资质与荣誉包括：\n· 专精特新「小巨人」企业（2024年通过复核）\n· 2025年度上海市制造业单项冠军\n· 国家知识产权示范企业创建对象（2025-2027）\n· 高新技术企业、上海市企业技术中心\n· IATF 16949 / ISO 9001 / ISO 14001 / ISO 45001 体系认证',
      actions: [{ label: '查看资质荣誉', target: '#honors' }],
    },
    {
      keys: ['联系', '电话', '地址', '邮箱', '总部', '在哪', '位置', '咨询'],
      reply: '欢迎联系精智：\n· 总部地址：上海市杨浦区杨树浦路1062号滨江国际广场4号楼\n· 服务热线：021-65380903\n· 蓝沃AI：400-666-2077 / mkt@level-ai.cn',
      actions: [{ label: '查看联系方式', target: '#contact' }],
    },
    {
      keys: ['股票', '上市', '挂牌', '证券', '代码', '873842'],
      reply: '精智于2023年在全国中小企业股份转让系统（新三板）挂牌：\n证券简称「精智实业」\n证券代码 873842',
      actions: [{ label: '查看新三板披露', href: 'https://www.neeq.com.cn/products/neeq_listed_companies/general_information.html?companyCode=873842&typename=J&xxfcbj=0' }],
    },
    {
      keys: ['工厂', '厂区', '基地', '产能'],
      reply: '精智已形成「十三地十五厂」的全国产业布局，工厂分布于上海（秀浦、川沙、嘉定等）、武汉、六安、淮安、湖州、芜湖、东莞等地，服务网络贴近客户现场。',
      actions: [{ label: '查看公司介绍', target: '#about' }],
    },
    {
      keys: ['案例', '客户', '行业', '应用'],
      reply: '精智深耕四大行业：汽车及零部件、通讯、新能源、机器人。\n服务从某个零件或工序切入，逐步扩展为模具、装备、零部件与软件的工程协同——网站「行业与案例」板块展示了6个匿名应用场景，欢迎查看。',
      actions: [{ label: '查看行业与案例', target: '#industries' }],
    },
    {
      keys: ['招聘', '人才', '加入', '工作', '实习'],
      reply: '感谢您对精智的关注！关于招聘与人才加入事宜，欢迎致电 021-65380903 咨询，或关注公司后续招聘信息发布。',
    },
    {
      keys: ['谢谢', '感谢', '辛苦了'],
      reply: '不客气，很高兴能帮到您！祝您工作顺利，如还有其他问题随时找我～',
    },
    {
      keys: ['再见', '拜拜', '结束'],
      reply: '再见！期待与您在精智相遇。',
    },
  ];

  const FALLBACK = {
    reply: '这个问题我还在学习中。您可以换个问法，点击下面的快捷问题，或直接拨打 021-65380903 联系我们的工程师。',
  };

  function dhAnswer(text) {
    const q = text.toLowerCase().replace(/\s+/g, '');
    for (const item of KB) {
      for (const key of item.keys) {
        if (q.includes(key.toLowerCase())) return item;
      }
    }
    return FALLBACK;
  }

  /* ---------- 全网搜索（DuckDuckGo 即时答案 JSONP，失败则回退搜索链接） ---------- */
  function searchWeb(q, cb) {
    let settled = false;
    const cbName = '__dhSearch' + Date.now();
    const script = document.createElement('script');
    const timer = setTimeout(() => finish(null), 6500);
    function finish(data) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { delete window[cbName]; } catch (e) { /* 忽略 */ }
      script.remove();
      cb(data);
    }
    window[cbName] = (data) => finish(parseDDG(data));
    script.onerror = () => finish(null);
    script.src = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(q) +
      '&format=json&no_html=1&skip_disambig=1&callback=' + cbName;
    document.head.appendChild(script);
  }

  function parseDDG(data) {
    if (!data) return null;
    const t = data.AbstractText || '';
    if (t.length > 15) {
      return { text: t.slice(0, 260), url: data.AbstractURL, source: data.AbstractSource || 'DuckDuckGo' };
    }
    const topics = data.RelatedTopics || [];
    for (const tp of topics) {
      if (tp.Text && tp.FirstURL) {
        return { text: tp.Text.slice(0, 260), url: tp.FirstURL, source: 'DuckDuckGo' };
      }
    }
    if (data.Answer) {
      return { text: String(data.Answer).slice(0, 260), url: data.AbstractURL, source: 'DuckDuckGo' };
    }
    return null;
  }

  function searchLink(engine, q) {
    if (engine === 'baidu') return 'https://www.baidu.com/s?wd=' + encodeURIComponent(q);
    if (engine === 'bing') return 'https://www.bing.com/search?q=' + encodeURIComponent(q);
    return 'https://www.google.com/search?q=' + encodeURIComponent(q);
  }

  /* ---------- 通用回复流程 ---------- */
  function replyFlow(reply, actions) {
    const bubble = addMsg('', 'ai', null);
    typewriter(bubble, reply, () => {
      if (actions && actions.length) actions.forEach((a) => makeLink(a, bubble));
      speak(reply);
      const speakDur = reply.length <= 90 ? reply.length * 34 : 1200;
      setTimeout(() => dh.classList.remove('dh-speaking'), speakDur + 1400);
      busy = false;
    });
  }

  /* ---------- 未命中知识库 → 全网搜索 ---------- */
  function webSearchFlow(q) {
    const searchQ = /精智|蓝沃|level|873842/i.test(q) ? q : '上海精智 ' + q;
    searchWeb(searchQ, (result) => {
      showTyping(false);
      if (result && result.text) {
        replyFlow(
          '关于「' + q + '」，我在全网检索到以下信息：\n' + result.text + '\n（来源：' + result.source + '）',
          [
            { label: '查看来源链接', href: result.url },
            { label: '百度搜索更多', href: searchLink('baidu', q) },
            { label: '必应搜索更多', href: searchLink('bing', q) },
          ]
        );
      } else {
        replyFlow('这个问题超出我的内置知识库，我为您生成了全网搜索链接，点击即可查看相关结果：', [
          { label: '百度搜索', href: searchLink('baidu', q) },
          { label: '必应搜索', href: searchLink('bing', q) },
          { label: '谷歌搜索', href: searchLink('google', q) },
        ]);
      }
    });
  }

  /* ---------- 面板开关 ---------- */
  function openPanel() {
    opened = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    badge.classList.add('hide');
    setTimeout(() => input.focus(), 350);
  }
  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  btn.addEventListener('click', () => (panel.classList.contains('open') ? closePanel() : openPanel()));
  closeBtn.addEventListener('click', closePanel);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });

  /* ---------- 语音播报（TTS） ---------- */
  let zhVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    zhVoice =
      voices.find((v) => /zh[-_]CN/i.test(v.lang) && /xiaoxiao|xiaoyi|yunxi|huihui/i.test(v.name)) ||
      voices.find((v) => /^zh/i.test(v.lang)) ||
      null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function speak(text) {
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[①②③·「」#\n]/g, ''));
      if (zhVoice) u.voice = zhVoice;
      u.lang = 'zh-CN';
      u.rate = 1.05;
      u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* 忽略 TTS 异常 */ }
  }
  voiceBtn.addEventListener('click', () => {
    voiceOn = !voiceOn;
    voiceBtn.classList.toggle('on', voiceOn);
    voiceBtn.title = voiceOn ? '关闭语音播报' : '开启语音播报';
    voiceBtn.setAttribute('aria-label', voiceBtn.title);
    if (!voiceOn && 'speechSynthesis' in window) speechSynthesis.cancel();
    else if (voiceOn) speak('语音播报已开启，很高兴为您服务');
  });

  /* ---------- 消息渲染 ---------- */
  function makeLink(a, bubble) {
    const link = document.createElement('span');
    link.className = 'dh-link';
    link.textContent = a.label;
    link.tabIndex = 0;
    link.setAttribute('role', 'link');
    const go = () => {
      if (a.href) {
        window.open(a.href, '_blank', 'noopener');
      } else if (a.target) {
        const el = document.querySelector(a.target);
        closePanel();
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      }
    };
    link.addEventListener('click', go);
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
    bubble.appendChild(document.createElement('br'));
    bubble.appendChild(link);
  }

  function addMsg(text, who, actions) {
    const wrap = document.createElement('div');
    wrap.className = 'dh-msg dh-msg-' + who;
    const meta = document.createElement('div');
    meta.className = 'dh-msg-meta';
    meta.textContent = who === 'ai' ? '小沃' : '您';
    const bubble = document.createElement('div');
    bubble.className = 'dh-bubble';
    bubble.textContent = text;
    if (actions && actions.length) actions.forEach((a) => makeLink(a, bubble));
    wrap.appendChild(meta);
    wrap.appendChild(bubble);
    // 消息插入在快捷问题之前，保证快捷问题始终在底部
    body.insertBefore(wrap, chips);
    body.scrollTop = body.scrollHeight;
    return bubble;
  }

  function showTyping(show) {
    typingEl.hidden = !show;
    if (show) {
      if (!typingEl.parentNode) body.insertBefore(typingEl, chips);
    }
    body.scrollTop = body.scrollHeight;
  }

  /* ---------- 打字机效果 ---------- */
  function typewriter(bubble, text, done) {
    if (prefersReducedMotion || text.length > 90) {
      bubble.textContent = text;
      done && done();
      return;
    }
    let i = 0;
    bubble.textContent = '';
    const t = setInterval(() => {
      bubble.textContent = text.slice(0, ++i);
      body.scrollTop = body.scrollHeight;
      if (i >= text.length) {
        clearInterval(t);
        done && done();
      }
    }, 34);
  }

  /* ---------- 问答流程 ---------- */
  function ask(question) {
    if (busy) return;
    busy = true;
    input.value = '';
    addMsg(question, 'user');
    const item = dhAnswer(question);

    dh.classList.add('dh-speaking');
    showTyping(true);
    const delay = 650 + Math.random() * 500;
    setTimeout(() => {
      if (item === FALLBACK) {
        // 知识库未命中 → 全网搜索
        webSearchFlow(question);
      } else {
        showTyping(false);
        const actions = (item.actions || []).concat([
          { label: '全网搜索相关问题', href: searchLink('bing', question) },
        ]);
        replyFlow(item.reply, actions);
      }
    }, delay);
  }

  function submit() {
    const q = input.value.trim();
    if (!q) return;
    ask(q);
  }
  sendBtn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) submit();
  });
  chips.addEventListener('click', (e) => {
    const btnQ = e.target.closest('button[data-q]');
    if (btnQ) ask(btnQ.dataset.q);
  });
})();



/* ==========================================================================
   精智前沿 · 新闻手风琴（点击展开）
   ========================================================================== */
(function () {
  'use strict';

  const items = document.querySelectorAll('.news-item');
  if (!items.length) return;

  items.forEach((item) => {
    const head = item.querySelector('.news-item-head');
    const body = item.querySelector('.news-item-body');
    if (!head || !body) return;
    body.removeAttribute('hidden');

    head.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      // 单开模式：关闭其他
      items.forEach((o) => {
        o.classList.remove('open');
        const h = o.querySelector('.news-item-head');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('open');
        head.setAttribute('aria-expanded', 'true');
        // 视频 iframe 首次展开时才加载
        const iframe = item.querySelector('iframe[data-src]');
        if (iframe && !iframe.getAttribute('src')) iframe.src = iframe.dataset.src;
        // 展开后若顶部被遮挡，滚动到可见位置
        setTimeout(() => {
          const r = item.getBoundingClientRect();
          if (r.top < 80) item.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 430);
      }
    });
  });

  // 默认展开第一条新闻（视频），打开网站立即可见
  const first = items[0];
  if (first) {
    first.classList.add('open');
    const fh = first.querySelector('.news-item-head');
    if (fh) fh.setAttribute('aria-expanded', 'true');
    const iframe = first.querySelector('iframe[data-src]');
    if (iframe && !iframe.getAttribute('src')) iframe.src = iframe.dataset.src;
  }
})();
