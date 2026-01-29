import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Layers, History, RotateCcw, X, Eye } from 'lucide-react';

// --- 常量定义 ---

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' };
const SUIT_COLORS = { spades: 'text-slate-900', hearts: 'text-red-600', clubs: 'text-slate-900', diamonds: 'text-red-600' };

const RANKS = [
  { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
  { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
  { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
  { label: 'J', value: 10 }, { label: 'Q', value: 10 }, { label: 'K', value: 10 },
  { label: 'A', value: 11 }
];

// 牌型配置：底数 (Chips) 和 倍数 (Mult)
const HAND_TYPES = {
  high_card: { name: '高牌', chips: 5, mult: 1 },
  pair: { name: '对子', chips: 10, mult: 2 },
  two_pair: { name: '两对', chips: 20, mult: 2 },
  three_of_a_kind: { name: '三条', chips: 30, mult: 3 },
  straight: { name: '顺子', chips: 30, mult: 4 },
  flush: { name: '同花', chips: 35, mult: 4 },
  full_house: { name: '葫芦', chips: 40, mult: 4 },
  four_of_a_kind: { name: '四条', chips: 60, mult: 7 },
  straight_flush: { name: '同花顺', chips: 100, mult: 8 },
};

// --- 辅助函数 ---

// 创建一副新牌
const createDeck = () => {
  const deck = [];
  SUITS.forEach(suit => {
    RANKS.forEach((rank, index) => {
      deck.push({
        id: `${suit}-${rank.label}`,
        suit,
        rank: rank.label,
        value: rank.value, // 计分用
        sortValue: index + 2 // 排序/逻辑判断用 (2=2, ... A=14)
      });
    });
  });
  return deck;
};

// 洗牌算法 (Fisher-Yates)
const shuffleDeck = (deck) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// --- 核心逻辑：牌型评估 ---

const evaluateHand = (selectedCards) => {
  if (selectedCards.length === 0) return null;

  // 按大小排序 (从大到小)
  const sorted = [...selectedCards].sort((a, b) => b.sortValue - a.sortValue);
  
  // 统计点数频率
  const rankCounts = {};
  sorted.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1; });
  const counts = Object.values(rankCounts).sort((a, b) => b - a); // e.g., [3, 2] for Full House

  // 检查同花
  const isFlush = sorted.length === 5 && sorted.every(c => c.suit === sorted[0].suit);

  // 检查顺子
  let isStraight = false;
  if (sorted.length === 5) {
    const values = sorted.map(c => c.sortValue);
    // 普通顺子
    const isNormalStraight = values.every((val, i) => i === 0 || val === values[i - 1] - 1);
    // A-5 顺子 (A, 5, 4, 3, 2) -> sortValue: 14, 5, 4, 3, 2
    const isLowAceStraight = values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2;
    isStraight = isNormalStraight || isLowAceStraight;
  }

  // 判定具体牌型 & 确定哪些牌是“计分牌”
  let typeKey = 'high_card';
  let scoringCards = []; // 只有这些牌会计入 Chips

  if (isFlush && isStraight) {
    typeKey = 'straight_flush';
    scoringCards = sorted;
  } else if (counts[0] === 4) {
    typeKey = 'four_of_a_kind';
    // 找到四条的 Rank
    const quadRank = Object.keys(rankCounts).find(key => rankCounts[key] === 4);
    scoringCards = sorted.filter(c => c.rank === quadRank);
  } else if (counts[0] === 3 && counts[1] === 2) {
    typeKey = 'full_house';
    scoringCards = sorted; // 全部计分
  } else if (isFlush) {
    typeKey = 'flush';
    scoringCards = sorted;
  } else if (isStraight) {
    typeKey = 'straight';
    scoringCards = sorted;
  } else if (counts[0] === 3) {
    typeKey = 'three_of_a_kind';
    const tripRank = Object.keys(rankCounts).find(key => rankCounts[key] === 3);
    scoringCards = sorted.filter(c => c.rank === tripRank);
  } else if (counts[0] === 2 && counts[1] === 2) {
    typeKey = 'two_pair';
    // 找到两个对子的 Rank
    const pairRanks = Object.keys(rankCounts).filter(key => rankCounts[key] === 2);
    scoringCards = sorted.filter(c => pairRanks.includes(c.rank));
  } else if (counts[0] === 2) {
    typeKey = 'pair';
    const pairRank = Object.keys(rankCounts).find(key => rankCounts[key] === 2);
    scoringCards = sorted.filter(c => c.rank === pairRank);
  } else {
    typeKey = 'high_card';
    // 高牌只有最大的一张计分
    scoringCards = [sorted[0]];
  }

  const handData = HAND_TYPES[typeKey];
  
  // 计算得分
  // 底数 = 牌型底数 + 计分牌面值之和
  const cardChips = scoringCards.reduce((sum, card) => sum + card.value, 0);
  const totalChips = handData.chips + cardChips;
  const totalMult = handData.mult;
  const score = totalChips * totalMult;

  return {
    handType: handData.name,
    chips: totalChips,
    baseChips: handData.chips,
    cardChips: cardChips,
    mult: totalMult,
    score: score,
    scoringCards: scoringCards,
    typeKey // 用于UI ID
  };
};

// --- 组件部分 ---

const Card = ({ card, selected, onClick, isScoringPreview }) => {
  return (
    <div
      onClick={() => onClick(card)}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 shadow-md cursor-pointer select-none transition-all duration-200
        flex flex-col items-center justify-center
        ${selected ? '-translate-y-6 border-blue-400 ring-2 ring-blue-400 shadow-xl z-10' : 'bg-gray-100 border-gray-300 hover:-translate-y-2'}
        ${isScoringPreview ? 'brightness-110 ring-2 ring-yellow-400 border-yellow-500' : ''}
        ${!selected && !isScoringPreview ? 'bg-slate-50' : 'bg-white'}
      `}
    >
      <div className={`absolute top-1 left-2 text-lg font-bold ${SUIT_COLORS[card.suit]}`}>
        {card.rank}
      </div>
      <div className={`text-4xl sm:text-5xl ${SUIT_COLORS[card.suit]}`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      <div className={`absolute bottom-1 right-2 text-lg font-bold ${SUIT_COLORS[card.suit]} rotate-180`}>
        {card.rank}
      </div>
      
      {/* 计分角标 (仅用于调试或详细视图，这里为了简洁不显示数值，只显示选中状态) */}
      {selected && (
        <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full shadow">
          {card.value}
        </div>
      )}
    </div>
  );
};

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// 牌堆矩阵视图
const DeckView = ({ deck, fullDeck }) => {
  // 统计剩余牌
  const remainingCounts = {}; // { 'spades-A': true, ... }
  deck.forEach(c => remainingCounts[c.id] = true);

  // 统计行列数据
  const suitCounts = {};
  const rankCounts = {};
  
  deck.forEach(c => {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {SUITS.map(suit => (
          <div key={suit} className="bg-slate-700 p-2 rounded text-center">
            <span className={`${SUIT_COLORS[suit]} text-xl mr-2`}>{SUIT_SYMBOLS[suit]}</span>
            <span className="text-white font-bold">{suitCounts[suit] || 0} 张</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-slate-400"></th>
              {RANKS.map(r => (
                <th key={r.label} className="p-2 text-slate-300 font-medium text-sm">{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUITS.map(suit => (
              <tr key={suit} className="border-b border-slate-700/50">
                <td className={`p-2 text-xl ${SUIT_COLORS[suit]}`}>{SUIT_SYMBOLS[suit]}</td>
                {RANKS.map(rank => {
                  const id = `${suit}-${rank.label}`;
                  const isPresent = remainingCounts[id];
                  return (
                    <td key={id} className="p-1">
                      <div className={`
                        w-6 h-8 mx-auto rounded flex items-center justify-center text-xs font-bold
                        ${isPresent ? 'bg-slate-200 text-slate-900 opacity-100' : 'bg-slate-700 text-slate-500 opacity-30'}
                      `}>
                        {isPresent ? '' : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-slate-400 text-sm text-center">
        * 高亮的方块表示牌堆中剩余的牌
      </div>
    </div>
  );
};

export default function App() {
  // --- 游戏状态 ---
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [playedHands, setPlayedHands] = useState([]);
  
  const [handsLeft, setHandsLeft] = useState(4);
  const [discardsLeft, setDiscardsLeft] = useState(3);
  const [totalScore, setTotalScore] = useState(0);
  
  const [gameState, setGameState] = useState('playing'); // playing, gameover
  const [msg, setMsg] = useState(null); // 临时的游戏提示

  // 模态框状态
  const [showHistory, setShowHistory] = useState(false);
  const [showDeck, setShowDeck] = useState(false);

  // 初始化游戏
  const initGame = () => {
    const newDeck = shuffleDeck(createDeck());
    const initialHand = newDeck.splice(0, 9);
    setDeck(newDeck);
    setHand(initialHand);
    setSelectedIds([]);
    setPlayedHands([]);
    setHandsLeft(4);
    setDiscardsLeft(3);
    setTotalScore(0);
    setGameState('playing');
    setMsg(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key.toLowerCase() === 's') setShowHistory(prev => !prev);
      if (e.key.toLowerCase() === 'd') setShowDeck(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // 计算当前选中牌的预测结果
  const previewData = useMemo(() => {
    const selectedCards = hand.filter(c => selectedIds.includes(c.id));
    return evaluateHand(selectedCards);
  }, [selectedIds, hand]);

  // --- 操作处理 ---

  const toggleSelect = (card) => {
    if (gameState !== 'playing') return;
    if (selectedIds.includes(card.id)) {
      setSelectedIds(prev => prev.filter(id => id !== card.id));
    } else {
      if (selectedIds.length >= 5) return; // 限制选5张
      setSelectedIds(prev => [...prev, card.id]);
    }
  };

  const drawUpTo = (currentHand, currentDeck, limit = 9) => {
    const needed = limit - currentHand.length;
    if (needed <= 0 || currentDeck.length === 0) return { newHand: currentHand, newDeck: currentDeck };
    
    const drawCount = Math.min(needed, currentDeck.length);
    const drawn = currentDeck.slice(0, drawCount);
    const remainingDeck = currentDeck.slice(drawCount);
    
    return {
      newHand: [...currentHand, ...drawn],
      newDeck: remainingDeck
    };
  };

  const playHand = () => {
    if (!previewData || selectedIds.length === 0) return;

    // 1. 记录得分
    setTotalScore(prev => prev + previewData.score);
    
    // 2. 记录历史
    setPlayedHands(prev => [{
      round: 4 - handsLeft + 1,
      handType: previewData.handType,
      score: previewData.score,
      base: previewData.chips,
      mult: previewData.mult,
      cards: hand.filter(c => selectedIds.includes(c.id))
    }, ...prev]);

    // 3. 移除手牌并抽牌
    const remainingHandCards = hand.filter(c => !selectedIds.includes(c.id));
    const { newHand, newDeck } = drawUpTo(remainingHandCards, deck);
    
    setHand(newHand);
    setDeck(newDeck);
    setSelectedIds([]);

    // 4. 扣除次数 & 检查结束
    const newHandsLeft = handsLeft - 1;
    setHandsLeft(newHandsLeft);

    // 反馈动画效果 (简单版)
    setMsg(`+${previewData.score}`);
    setTimeout(() => setMsg(null), 1000);

    if (newHandsLeft <= 0) {
      setGameState('gameover');
    } else if (newHand.length === 0) {
        // 手牌为空且牌堆为空，没法继续操作了
        setGameState('gameover');
    }
  };

  const discardHand = () => {
    if (discardsLeft <= 0 || selectedIds.length === 0) return;

    // 移除选中牌
    const remainingHandCards = hand.filter(c => !selectedIds.includes(c.id));
    const { newHand, newDeck } = drawUpTo(remainingHandCards, deck);

    setHand(newHand);
    setDeck(newDeck);
    setSelectedIds([]);
    setDiscardsLeft(prev => prev - 1);
  };

  // 识别哪些牌是计分牌用于高亮
  const scoringCardIds = previewData?.scoringCards?.map(c => c.id) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      
      {/* 顶部状态栏 */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              POKER ROGUE
            </h1>
            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">v1.0</span>
          </div>

          <div className="flex gap-6 md:gap-12 items-center">
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider">当前得分</div>
              <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
                {totalScore.toLocaleString()}
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-2 px-4 flex flex-col items-center min-w-[80px]">
                <span className="text-xs text-blue-300 font-bold uppercase">出牌次数</span>
                <span className="text-xl font-bold text-blue-100">{handsLeft}</span>
              </div>
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-2 px-4 flex flex-col items-center min-w-[80px]">
                <span className="text-xs text-red-300 font-bold uppercase">弃牌次数</span>
                <span className="text-xl font-bold text-red-100">{discardsLeft}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-1 text-sm"
              title="查看历史 (S)"
            >
              <History size={18} />
              <span className="hidden sm:inline">历史 (S)</span>
            </button>
            <button 
              onClick={() => setShowDeck(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-1 text-sm"
              title="查看牌堆 (D)"
            >
              <Layers size={18} />
              <span className="hidden sm:inline">牌堆 (D)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 游戏主区域 */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* 浮动得分提示 */}
        {msg && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce z-50">
            <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] stroke-black">
              {msg}
            </div>
          </div>
        )}

        {/* 预览面板 */}
        <div className="mb-8 w-full max-w-2xl min-h-[100px] flex items-center justify-center">
          {previewData ? (
            <div className="bg-slate-800/80 backdrop-blur border border-slate-600 rounded-xl p-4 w-full flex items-center justify-between shadow-2xl transform transition-all animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">牌型</span>
                <span className="text-2xl font-bold text-white">{previewData.handType}</span>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-blue-400 font-bold">底数</span>
                  <span className="text-2xl font-mono text-blue-100">{previewData.chips}</span>
                </div>
                <div className="text-slate-500">X</div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-red-400 font-bold">倍数</span>
                  <span className="text-2xl font-mono text-red-100">{previewData.mult}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">预计得分</div>
                <div className="text-3xl font-black text-yellow-400 tabular-nums">
                  {previewData.score.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-600 text-sm font-medium tracking-widest uppercase animate-pulse">
              选中牌以预览得分
            </div>
          )}
        </div>

        {/* 手牌区域 */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-10 w-full max-w-5xl px-2">
          {hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              selected={selectedIds.includes(card.id)}
              onClick={toggleSelect}
              isScoringPreview={previewData && scoringCardIds.includes(card.id)}
            />
          ))}
          {hand.length === 0 && gameState === 'playing' && (
             <div className="text-slate-500 text-lg">手牌为空...</div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-4 z-10">
            {gameState === 'playing' ? (
                <>
                    <button
                        onClick={playHand}
                        disabled={selectedIds.length === 0}
                        className={`
                            px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex flex-col items-center min-w-[140px]
                            ${selectedIds.length > 0 
                                ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white hover:translate-y-1 hover:shadow-md active:translate-y-2 border-b-4 border-blue-900' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed border-b-4 border-slate-800'}
                        `}
                    >
                        <span>出牌</span>
                    </button>

                    <button
                        onClick={discardHand}
                        disabled={selectedIds.length === 0 || discardsLeft <= 0}
                        className={`
                            px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex flex-col items-center min-w-[140px]
                            ${selectedIds.length > 0 && discardsLeft > 0
                                ? 'bg-gradient-to-b from-red-500 to-red-700 text-white hover:translate-y-1 hover:shadow-md active:translate-y-2 border-b-4 border-red-900' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed border-b-4 border-slate-800'}
                        `}
                    >
                        <span>弃牌</span>
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center gap-4 bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-2xl animate-in zoom-in">
                    <h2 className="text-3xl font-bold text-white mb-2">游戏结束</h2>
                    <div className="text-center mb-6">
                        <div className="text-slate-400 text-sm uppercase">最终得分</div>
                        <div className="text-5xl font-black text-yellow-400 mt-1">{totalScore.toLocaleString()}</div>
                    </div>
                    <button 
                        onClick={initGame}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <RotateCcw size={20} />
                        再来一局
                    </button>
                </div>
            )}
        </div>
        
        {/* 底部信息 */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-slate-600 text-sm">
          剩余牌数: {deck.length}
        </div>
      </main>

      {/* 历史记录模态框 */}
      <Modal title="出牌记录" isOpen={showHistory} onClose={() => setShowHistory(false)}>
        {playedHands.length === 0 ? (
          <div className="text-center text-slate-500 py-8">暂无出牌记录</div>
        ) : (
          <div className="space-y-3">
            {playedHands.map((h, i) => (
              <div key={i} className="bg-slate-700/50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{h.handType}</span>
                    <span className="text-xs bg-slate-600 px-1.5 rounded text-slate-300">Round {h.round}</span>
                  </div>
                  <div className="flex gap-1 text-sm text-slate-400">
                    {h.cards.map((c, idx) => (
                      <span key={idx} className={`${SUIT_COLORS[c.suit]}`}>{SUIT_SYMBOLS[c.suit]}{c.rank}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold font-mono">{h.score.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 font-mono">{h.base} x {h.mult}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 牌堆模态框 */}
      <Modal title="剩余牌堆" isOpen={showDeck} onClose={() => setShowDeck(false)}>
        <DeckView deck={deck} />
      </Modal>
    </div>
  );
}