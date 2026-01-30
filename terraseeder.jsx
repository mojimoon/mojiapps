import React, { useState, useEffect, useMemo } from 'react';
import { Copy, RefreshCw, Trash2, Settings, Info, Check, AlertTriangle } from 'lucide-react';

const App = () => {
  // 基础选项状态
  const [size, setSize] = useState(2);
  const [difficulty, setDifficulty] = useState(2);
  const [evil, setEvil] = useState(0); // 0=随机, 1=腐化, 2=猩红
  const [seedNumber, setSeedNumber] = useState('');

  // 特殊标志定义
  const specialFlagsData = [
    { value: 0, label: "普通", desc: "默认" },
    { value: 1, label: "一醉方休", code: "05162020", desc: "Drunk World" },
    { value: 2, label: "蜜蜂之惧", code: "Not the Bees", desc: "Not the bees" },
    { value: 4, label: "勇者之境", code: "For the worthy", desc: "FTW" },
    { value: 8, label: "十年庆典", code: "05162021", desc: "Celebrationmk10" },
    { value: 16, label: "永恒领域", code: "The Constant", desc: "Don't Starve" },
    { value: 32, label: "颠倒世界", code: "Don't Dig Up", desc: "Remix" },
    { value: 64, label: "没有机关", code: "No Traps", desc: "No Traps" },
    { value: 255, label: "天顶世界", code: "Get Fixed Boi", desc: "Zenith", special: true },
    { value: 256, label: "天空之岛", code: "Skyblock", desc: "Skyblock" },
  ];

  const [selectedFlags, setSelectedFlags] = useState([0]);

  // 彩蛋种子定义
  const secretSeedsData = [
    { id: "monochrome", label: "画面黑白化", desc: "monochrome" },
    { id: "negative", label: "画面负片化", desc: "negative infinity" },
    { id: "invisible", label: "隐形世界", desc: "invisible plane" },
    { id: "xray", label: "全亮世界", desc: "xray vision" },
    { id: "mole", label: "无地表", desc: "mole people" },
    { id: "rainforest", label: "更多生命树", desc: "save the rainforest" },
    { id: "carebears", label: "更多浮空岛", desc: "the carebears movie" },
    { id: "error", label: "错误世界", desc: "i am error" },
    { id: "zombie", label: "活死人之夜", desc: "night of the living dead" },
    { id: "heights", label: "太空高度地表", desc: "such great heights" },
    { id: "rain", label: "永恒之雨", desc: "bring a towel" },
    { id: "manors", label: "更大的废弃房屋", desc: "abandoned manors" },
    { id: "spawn", label: "随机出生点", desc: "how did i get here" },
    { id: "teleporter", label: "添加传送机", desc: "beam me up" },
    { id: "hardmode", label: "困难模式开局", desc: "too easy" },
    { id: "fishmox", label: "无感染模式", desc: "fishmox" },
    { id: "hallow", label: "地表神圣", desc: "（尚未揭示）", disabled: true },
    { id: "purify", label: "感染世界", desc: "purify this" },
    { id: "mushroom", label: "蘑菇地表", desc: "toadstool" },
    { id: "desert", label: "沙漠地表", desc: "sandy britches" },
    { id: "poop", label: "便便世界", desc: "truck stop" },
    { id: "spider", label: "没有蜘蛛洞", desc: "arachnophobia" },
    { id: "traps", label: "没有陷阱", desc: "more traps please" },
    { id: "rainbow", label: "彩虹之路", desc: "rainbow road" },
    { id: "rocks", label: "崎岖岩石", desc: "jagged rocks" },
    { id: "planetoids", label: "小行星", desc: "planetoids" },
    { id: "waterpark", label: "水上乐园", desc: "waterpark" },
    { id: "portal", label: "箱子内有传送枪", desc: "（尚未揭示）", disabled: true },
    { id: "winter", label: "凛冬将至", desc: "winter is coming" },
    { id: "pumpkin", label: "南瓜季", desc: "pumpkin season" },
    { id: "hocus", label: "永久万圣节", desc: "hocus pocus" },
    { id: "jingle", label: "永久圣诞节", desc: "jingle all the way" },
    { id: "curse", label: "恶魔城诅咒", desc: "what a horrible night to have a curse" },
    { id: "royale", label: "大逃杀/团队出生点", desc: "royale with cheese" },
    { id: "dungeon", label: "双地牢", desc: "dual dungeons" },
  ];

  const [selectedSecretSeeds, setSelectedSecretSeeds] = useState([]);

  // 初始化随机种子
  useEffect(() => {
    generateRandomSeed();
  }, []);

  const generateRandomSeed = () => {
    const rand = Math.floor(Math.random() * 2147483648);
    setSeedNumber(rand.toString());
  };

  // 处理特殊标志逻辑
  const toggleFlag = (val) => {
    let next = [...selectedFlags];
    
    if (val === 0) {
      setSelectedFlags([0]);
      return;
    }

    if (val === 255) {
      if (next.includes(255)) {
        setSelectedFlags([0]);
      } else {
        // 选中 255 包含 1-64，且不包含 0
        const otherFlags = next.filter(f => f === 256);
        setSelectedFlags([255, ...otherFlags]);
      }
      return;
    }

    if (next.includes(val)) {
      next = next.filter(f => f !== val);
      if (next.length === 0) next = [0];
    } else {
      next = next.filter(f => f !== 0);
      next.push(val);
    }
    setSelectedFlags(next);
  };

  // 处理彩蛋种子逻辑
  const toggleSecretSeed = (id, disabled) => {
    if (disabled) return;
    if (selectedSecretSeeds.includes(id)) {
      setSelectedSecretSeeds(selectedSecretSeeds.filter(s => s !== id));
    } else {
      setSelectedSecretSeeds([...selectedSecretSeeds, id]);
    }
  };

  // 计算最终标志值
  const finalFlagValue = useMemo(() => {
    if (selectedFlags.includes(0) && selectedFlags.length === 1) return 0;
    let sum = 0;
    selectedFlags.forEach(f => {
        if(f !== 0) sum += f;
    });
    return sum;
  }, [selectedFlags]);

  // 生成最终种子字符串
  const finalSeedString = useMemo(() => {
    const parts = [];
    parts.push(size);
    parts.push(difficulty);
    // 邪恶：用户选随机(0)时，逻辑上通常由游戏决定，但生成的种子需填 1 或 2，此处若为0则默认出随机
    parts.push(evil === 0 ? Math.floor(Math.random() * 2) + 1 : evil);
    parts.push(finalFlagValue);
    
    // 彩蛋码
    const codes = selectedSecretSeeds.map(id => {
      const item = secretSeedsData.find(d => d.id === id);
      return item ? item.desc : null;
    }).filter(Boolean);
    
    if (codes.length > 0) {
      parts.push(codes.join('|'));
    }

    parts.push(seedNumber || Math.floor(Math.random() * 2147483648));

    return parts.join('.');
  }, [size, difficulty, evil, finalFlagValue, selectedSecretSeeds, seedNumber]);

  // 重置
  const handleReset = () => {
    setSize(2);
    setDifficulty(2);
    setEvil(0);
    setSelectedFlags([0]);
    setSelectedSecretSeeds([]);
    generateRandomSeed();
  };

  // 全部随机
  const handleRandomAll = () => {
    setSize(Math.floor(Math.random() * 3) + 1);
    setDifficulty(Math.floor(Math.random() * 4) + 1);
    setEvil(Math.floor(Math.random() * 3));
    generateRandomSeed();
    
    // 随机标志（简单处理）
    const randFlagRoll = Math.random();
    if (randFlagRoll > 0.8) {
        setSelectedFlags([255]);
    } else if (randFlagRoll > 0.5) {
        setSelectedFlags([1, 8]);
    } else {
        setSelectedFlags([0]);
    }

    // 随机彩蛋种子
    const shuffled = [...secretSeedsData].filter(d => !d.disabled).sort(() => 0.5 - Math.random());
    setSelectedSecretSeeds(shuffled.slice(0, Math.floor(Math.random() * 3)).map(d => d.id));
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = finalSeedString;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert("种子已复制到剪贴板！");
    } catch (err) {
      alert("复制失败，请手动选择复制。");
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Settings className="w-8 h-8 text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              泰拉瑞亚 1.4.5 种子生成助手
            </h1>
            <p className="text-slate-400">Terraria World Seed Generator v1.4.5</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧配置区 */}
          <div className="lg:col-span-8 space-y-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
            
            {/* 基础选项 */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">世界大小</h3>
                <div className="flex flex-wrap gap-2">
                  {["小世界 (1)", "中世界 (2)", "大世界 (3)"].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setSize(i + 1)}
                      className={`px-4 py-2 rounded-lg transition-all border ${size === i + 1 ? 'bg-emerald-500 border-emerald-400 text-slate-900 font-bold shadow-lg shadow-emerald-500/20' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">游戏难度</h3>
                <div className="flex flex-wrap gap-2">
                  {["普通 (1)", "专家 (2)", "大师 (3)", "旅途 (4)"].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setDifficulty(i + 1)}
                      className={`px-4 py-2 rounded-lg transition-all border ${difficulty === i + 1 ? 'bg-cyan-500 border-cyan-400 text-slate-900 font-bold shadow-lg shadow-cyan-500/20' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">邪恶类型</h3>
                <div className="flex flex-wrap gap-2">
                  {["随机 (0)", "腐化 (1)", "猩红 (2)"].map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setEvil(i)}
                      className={`px-4 py-2 rounded-lg transition-all border ${evil === i ? 'bg-purple-500 border-purple-400 text-white font-bold shadow-lg shadow-purple-500/20' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* 特殊标志 */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                特殊标志 (多选) <span className="text-xs normal-case text-slate-600 font-normal">当前值: {finalFlagValue}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {specialFlagsData.map((flag) => {
                  const isZenithActive = selectedFlags.includes(255);
                  const isCurrentActive = selectedFlags.includes(flag.value);
                  const isDisabled = flag.value !== 255 && flag.value !== 0 && flag.value !== 256 && isZenithActive;
                  
                  return (
                    <button
                      key={flag.value}
                      disabled={isDisabled}
                      onClick={() => toggleFlag(flag.value)}
                      className={`group relative p-3 rounded-xl border text-left transition-all overflow-hidden
                        ${flag.special ? 'border-orange-500/50 hover:border-orange-500' : 'border-slate-700 hover:border-slate-500'}
                        ${isCurrentActive ? 'bg-slate-700' : 'bg-slate-800/40'}
                        ${isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-900/50' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-mono ${flag.special ? 'text-orange-400' : 'text-slate-500'}`}>{flag.value}</span>
                        {isCurrentActive && <Check className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div className={`text-sm font-medium ${flag.special ? 'text-orange-100 italic' : ''}`}>
                        {flag.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">{flag.desc}</div>
                      {isCurrentActive && !isDisabled && (
                        <div className={`absolute bottom-0 left-0 h-1 w-full ${flag.special ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 彩蛋种子 */}
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                彩蛋种子 (多选)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {secretSeedsData.map((seed) => (
                  <button
                    key={seed.id}
                    disabled={seed.disabled}
                    onClick={() => toggleSecretSeed(seed.id, seed.disabled)}
                    className={`flex flex-col p-2.5 rounded-lg border text-left transition-all
                      ${seed.disabled ? 'border-dashed border-slate-700 opacity-50 cursor-not-allowed grayscale' : 'border-slate-700 hover:bg-slate-700/50'}
                      ${selectedSecretSeeds.includes(seed.id) ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-slate-800/30'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border ${selectedSecretSeeds.includes(seed.id) ? 'bg-indigo-400 border-indigo-300' : 'border-slate-500'}`}></div>
                      <span className="text-sm font-medium">{seed.label}</span>
                    </div>
                    <span className={`text-[10px] mt-1 ml-5 ${seed.disabled ? 'text-pink-400 font-bold' : 'text-slate-500'}`}>
                        {seed.desc}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* 随机数 */}
            <section className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">随机数 (Seed)</h3>
                <input
                  type="text"
                  placeholder="留空则随机生成..."
                  value={seedNumber}
                  onChange={(e) => setSeedNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <button 
                onClick={generateRandomSeed}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                title="重新生成随机数"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </section>

            {/* 底部控制 */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
              <button 
                onClick={handleRandomAll}
                className="flex-1 min-w-[120px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> 随机所有
              </button>
              <button 
                onClick={handleReset}
                className="flex-1 min-w-[120px] bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition-all border border-slate-600 active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> 重置
              </button>
            </div>
          </div>

          {/* 右侧结果区 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 sticky top-8 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                  生成结果
                </h3>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-emerald-400 flex items-center gap-1 text-sm font-medium"
                >
                  <Copy className="w-4 h-4" /> 复制
                </button>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 break-all font-mono text-lg text-emerald-400 selection:bg-emerald-500/30">
                {finalSeedString}
              </div>

              <div className="mt-8 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4" /> 格式说明
                </h4>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">大小.</span>
                    <span>1=小, 2=中, 3=大</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">难度.</span>
                    <span>1=普, 2=专, 3=师, 4=旅</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">邪恶.</span>
                    <span>1=腐, 2=猩</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">标志.</span>
                    <span>选项值之和 (如 1+8=9)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">彩蛋.</span>
                    <span>代码以 | 分隔 (可选)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">随机.</span>
                    <span>一个 32 位正整数</span>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 mb-1 font-bold text-xs uppercase tracking-tight">
                    <AlertTriangle className="w-3 h-3" /> 注意事项
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    特殊标志 0 与其他互斥。
                    天顶世界 (255) 包含醉酒、蜜蜂、FTW、周年、永恒、颠倒、无陷阱所有逻辑。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }
      `}</style>
    </div>
  );
};

export default App;