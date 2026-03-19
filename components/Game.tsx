'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NODES, EDGES, HAZARD_QUESTIONS, EXCURSIONS, POINTS, QUESTION_TIME, STOP_TIME, STOP_LABELS, FATIGUE, type Node, type Edge } from '@/lib/game-data';
import { shuffleAnswers, calculateRoadPoints, getSpeedRating, getStreakLabel, getStarRating, formatTripTime, saveGame, loadGame, clearSave, getResultMessage, type ShuffledQuestion, type SaveData } from '@/lib/game-engine';
import { getQuestionsForRegion, getExploresForCity, getRestQuestionsForRegion, getLightningQuestions, type RawQuestion, type RawExploreStop } from '@/lib/questions';
import { getCityImage, getRegionImage, getStopImage, getResultImage } from '@/lib/images';
import { audio, setAudioMuted } from '@/lib/audio';

import LocationHeader from '@/components/LocationHeader';
import DecoHeader from '@/components/DecoHeader';
import SceneImage from '@/components/SceneImage';
import AnswerButton from '@/components/AnswerButton';
import StatsBar from '@/components/StatsBar';
import GameMap from '@/components/GameMap';
import InfoBox from '@/components/InfoBox';
import TimerRing from '@/components/TimerRing';

type Phase = 'home' | 'approach' | 'pick_lane' | 'road_q' | 'detour_q' | 'hazard' | 'rest_stop' | 'rest_q' | 'lightning' | 'game_over';

export default function Game() {
  // Game state
  const [phase, setPhase] = useState<Phase>('home');
  const [currentNode, setCurrentNode] = useState(0);
  const [points, setPoints] = useState(0);
  const [miles, setMiles] = useState(0);
  const [qAns, setQAns] = useState(0);
  const [qCorr, setQCorr] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const [postcards, setPostcards] = useState<string[]>([]);
  const [masteredCities, setMasteredCities] = useState<number[]>([]);
  const [perfectCities, setPerfectCities] = useState<Set<number>>(new Set()); // Cities with zero wrong answers
  const [cityMissed, setCityMissed] = useState(false); // Has player gotten one wrong at current city
  const [usedQs, setUsedQs] = useState<Set<string>>(new Set());
  const [restedNodes, setRestedNodes] = useState<Set<number>>(new Set());
  const [visitedDetours, setVisitedDetours] = useState<Set<string>>(new Set());
  const [lastRegion, setLastRegion] = useState('');
  const [streakFlash, setStreakFlash] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [totalTrips, setTotalTrips] = useState(0);
  const [tripMinutes, setTripMinutes] = useState(0); // Elapsed trip time in minutes
  const [dayMinutes, setDayMinutes] = useState(0);  // Minutes driven today (resets on hotel/overnight)

  // Question state
  const [curEdge, setCurEdge] = useState<(Edge & { destination: number }) | null>(null);
  const [curQ, setCurQ] = useState<RawQuestion | null>(null);
  const [shuf, setShuf] = useState<ShuffledQuestion | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const [timer, setTimer] = useState(QUESTION_TIME);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintElim, setHintElim] = useState<number[]>([]);
  const [qStartTime, setQStartTime] = useState(0);
  const [laneChoices, setLaneChoices] = useState<string[]>([]);
  const [currentLane, setCurrentLane] = useState<string | null>(null); // Selected category for this city
  const [roadQNum, setRoadQNum] = useState(0);    // Which road question (0-4) at current city
  const [roadQTotal] = useState(5);                // Questions per city visit

  // Detour (Explore) state
  const [detour, setDetour] = useState<RawExploreStop | null>(null);
  const [detourSel, setDetourSel] = useState<number | null>(null);

  // Hazard state
  const [hazard, setHazard] = useState<typeof HAZARD_QUESTIONS[0] | null>(null);

  // Rest stop state
  const [restPool, setRestPool] = useState<RawQuestion[]>([]);
  const [restIdx, setRestIdx] = useState(0);
  const [restSel, setRestSel] = useState<number | null>(null);
  const [restPts, setRestPts] = useState(0);

  // Lightning round state
  const [lightningPool, setLightningPool] = useState<RawQuestion[]>([]);
  const [lightningIdx, setLightningIdx] = useState(0);
  const [lightningSel, setLightningSel] = useState<number | null>(null);
  const [lightningCorrect, setLightningCorrect] = useState(0);
  const [lightningTotal, setLightningTotal] = useState(10);

  // UI state
  const [showEditions, setShowEditions] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  const [showDriving, setShowDriving] = useState(false);
  const [drivingEdge, setDrivingEdge] = useState<(Edge & { destination: number }) | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (next) audio.stopSpeaking();
  }

  const MuteBtn = () => (
    <button onClick={toggleMute} className="text-gray-400 hover:text-gray-600 text-xs font-mono px-2 py-1 rounded-lg border border-gray-200 bg-white">
      {muted ? '🔇 Muted' : '🔊 Sound'}
    </button>
  );

  // Derived values
  const node = NODES[currentNode];
  const accuracy = qAns > 0 ? Math.round((qCorr / qAns) * 100) : 0;

  // Available edges from current node
  const availEdges = (() => {
    let edges = EDGES
      .filter(e => e.from === currentNode || e.to === currentNode)
      .map(e => ({ ...e, destination: e.from === currentNode ? e.to : e.from }))
      .filter(e => e.destination === NODES.length - 1 || !visited.includes(e.destination));
    if (edges.length === 0) {
      edges = EDGES
        .filter(e => e.from === currentNode || e.to === currentNode)
        .map(e => ({ ...e, destination: e.from === currentNode ? e.to : e.from }))
        .sort((a, b) => b.destination - a.destination);
    }
    return edges;
  })();

  // Timer effect
  useEffect(() => {
    if ((phase === 'road_q' || phase === 'detour_q' || phase === 'lightning') && timer > 0 && sel === null && detourSel === null && lightningSel === null) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [phase, timer, sel, detourSel, lightningSel]);

  // Timer expiry
  useEffect(() => {
    if (phase === 'road_q' && timer === 0 && sel === null) { audio.timeUp(); doRoadAns(-1); }
    if (phase === 'detour_q' && timer === 0 && detourSel === null) { audio.timeUp(); doDetourAns(-1); }
    if (phase === 'lightning' && timer === 0 && lightningSel === null) { audio.timeUp(); setLightningSel(-1); }
    if ((phase === 'road_q' || phase === 'detour_q' || phase === 'lightning') && timer === 5) { audio.tick(); }
  }, [timer]);

  // Image error handler - tracks which images failed to load
  const onImgError = useCallback((path: string) => {
    setImgErrors(prev => new Set([...Array.from(prev), path]));
  }, []);

  // Load saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved && saved.gameStarted) {
      setCurrentNode(saved.currentNode);
      setPoints(saved.points);
      setMiles(saved.miles);
      setQAns(saved.qAns);
      setQCorr(saved.qCorr);
      setBestStreak(saved.bestStreak);
      setVisited(saved.visited);
      setPostcards(saved.postcards);
      setMasteredCities(saved.masteredCities);
      setPerfectCities(new Set(saved.perfectCities || []));
      setUsedQs(new Set(saved.usedQuestions));
      setRestedNodes(new Set(saved.restedNodes));
      setVisitedDetours(new Set(saved.visitedDetours));
      setLastRegion(saved.lastRegion);
      setTotalTrips(saved.totalTrips);
      setTripMinutes(saved.tripMinutes || 0);
      setDayMinutes(saved.dayMinutes || 0);
      setCityMissed(saved.cityMissed || false);
      setGameStarted(true);
    }
  }, []);

  // Auto-save on phase changes (home, approach, game_over)
  useEffect(() => {
    if (gameStarted && (phase === 'home' || phase === 'approach' || phase === 'game_over')) {
      saveGame({
        playerName: 'Dan',
        currentNode, points, miles, qAns, qCorr, bestStreak,
        visited, postcards, masteredCities,
        perfectCities: Array.from(perfectCities),
        usedQuestions: Array.from(usedQs),
        restedNodes: Array.from(restedNodes),
        visitedDetours: Array.from(visitedDetours),
        lastRegion, gameStarted, totalTrips,
        tripMinutes, dayMinutes, cityMissed,
      });
    }
  }, [phase, gameStarted]);

  // Get image src only if not in error set
  // Image helper — passes paths through, filters out known failures
  const img = useCallback((path: string | undefined): string | undefined => {
    if (!path || imgErrors.has(path)) return undefined;
    return path;
  }, [imgErrors]);

  // ============ GAME ACTIONS ============

  function startGame() {
    audio.init();
    audio.tick();
    setCurrentNode(0);
    setPoints(0);
    setMiles(0);
    setQAns(0);
    setQCorr(0);
    setStreak(0);
    setBestStreak(0);
    setVisited([]);
    setPostcards([]);
    setMasteredCities([]);
    setPerfectCities(new Set());
    setCityMissed(false);
    setUsedQs(new Set());
    setRestedNodes(new Set());
    setVisitedDetours(new Set());
    setHintUsed(false);
    setHintElim([]);
    setLastRegion('');
    setStreakFlash('');
    setTripMinutes(0);
    setDayMinutes(0);
    setGameStarted(true);

    // Launch Lightning Round — 10 Route 66 general knowledge questions
    const lq = getLightningQuestions(10);
    setLightningPool(lq);
    setLightningIdx(0);
    setLightningCorrect(0);
    setLightningTotal(lq.length);
    const sh = shuffleAnswers(lq[0] as any);
    setShuf(sh);
    setLightningSel(null);
    setTimer(15); // Lightning round: 15 seconds per question
    setQStartTime(Date.now());
    audio.speakQuestion(lq[0].q, sh.a);
    setPhase('lightning');
  }

  // Calculate timer adjusted for fatigue
  const getFatigueTimer = useCallback(() => {
    const dayHours = dayMinutes / 60;
    if (dayHours >= FATIGUE.EXHAUSTED_HOURS) return QUESTION_TIME - FATIGUE.TIMER_PENALTY_EXHAUSTED;
    if (dayHours >= FATIGUE.TIRED_HOURS) return QUESTION_TIME - FATIGUE.TIMER_PENALTY_TIRED;
    return QUESTION_TIME;
  }, [dayMinutes]);

  const isFatigued = dayMinutes / 60 >= FATIGUE.TIRED_HOURS;
  const isSunset = dayMinutes / 60 >= FATIGUE.SUNSET_HOURS;

  function jumpToCity(targetNode: number) {
    // Find the path from current to target and add up all miles/time
    // Simple approach: walk forward through edges until we reach target
    let walkNode = currentNode;
    let totalMiles = 0;
    let totalMinutes = 0;
    const walkVisited: number[] = [];
    const maxSteps = 10;
    let steps = 0;

    while (walkNode !== targetNode && steps < maxSteps) {
      const edges = EDGES
        .filter(e => e.from === walkNode || e.to === walkNode)
        .map(e => ({ ...e, destination: e.from === walkNode ? e.to : e.from }))
        .filter(e => !visited.includes(e.destination) && !walkVisited.includes(e.destination));
      
      // Find edge that leads toward target
      const directEdge = edges.find(e => e.destination === targetNode);
      const nextEdge = directEdge || edges[0];
      if (!nextEdge) break;

      totalMiles += nextEdge.miles;
      totalMinutes += Math.round((nextEdge.miles / (nextEdge.avgSpeed || 55)) * 60);
      walkVisited.push(nextEdge.destination);
      walkNode = nextEdge.destination;
      steps++;
    }

    if (walkNode === targetNode) {
      setMiles(m => m + totalMiles);
      setTripMinutes(t => t + totalMinutes);
      setDayMinutes(d => d + totalMinutes);
      setCurrentNode(targetNode);
      setCityMissed(false);
      setVisited(v => [...v, ...walkVisited]);
      setPhase('approach');
    }
  }

  function selectEdge(edge: Edge & { destination: number }) {
    audio.stopSpeaking();
    // Check mastery before leaving — includes Discovery, Attractions, Excursions, Rest
    const stops = getExploresForCity(node.name);
    const doneStops = stops.filter((_, i) => visitedDetours.has(`${currentNode}-${i}`)).length;
    const excursions = EXCURSIONS[currentNode] || [];
    const doneExc = excursions.filter((_, i) => visitedDetours.has(`exc-${currentNode}-${i}`)).length;
    const hasRest = node.isCity && getRestQuestionsForRegion(edge.region).length > 0;
    const restDone = restedNodes.has(currentNode);
    const totalAct = stops.length + excursions.length + (hasRest ? 1 : 0);
    const doneAct = doneStops + doneExc + (restDone ? 1 : 0);
    if (totalAct > 0 && doneAct === totalAct && !masteredCities.includes(currentNode)) {
      setMasteredCities(prev => [...prev, currentNode]);
      if (!cityMissed) {
        setPerfectCities(prev => new Set([...Array.from(prev), currentNode]));
      }
    }

    setCurEdge(edge);
    const pool = getQuestionsForRegion(edge.region);
    const avail = pool.filter((_, i) => !usedQs.has(`r-${edge.region}-${i}`));
    const usePool = avail.length > 0 ? avail : pool;

    // Get categories for Pick Your Lane
    const cats: Record<string, boolean> = {};
    usePool.forEach(q => { cats[q.category || 'General'] = true; });
    const catList = Object.keys(cats).sort(() => Math.random() - 0.5);
    const choices = catList.slice(0, Math.min(3, catList.length));

    if (choices.length >= 2) {
      setLaneChoices(choices);
      setPhase('pick_lane');
    } else {
      launchQuestion(edge, null);
    }
  }

  function pickLane(cat: string) {
    setCurrentLane(cat);
    setRoadQNum(0);
    if (curEdge) launchQuestion(curEdge, cat);
  }

  function launchQuestion(edge: Edge & { destination: number }, cat: string | null) {
    const pool = getQuestionsForRegion(edge.region);
    let avail = pool.filter((_, i) => !usedQs.has(`r-${edge.region}-${i}`));
    if (avail.length === 0) avail = pool;
    if (cat) {
      const catAvail = avail.filter(q => q.category === cat);
      if (catAvail.length > 0) avail = catAvail;
    }
    const pick = avail[Math.floor(Math.random() * avail.length)];
    setUsedQs(prev => new Set([...Array.from(prev), `r-${edge.region}-${pool.indexOf(pick)}`]));
    const sh = shuffleAnswers(pick as any);
    setCurQ(pick);
    setShuf(sh);
    setSel(null);
    setTimer(getFatigueTimer());
    setQStartTime(Date.now());
    setHintUsed(false);
    setHintElim([]);
    audio.speakQuestion(pick.q, sh.a);
    setPhase('road_q');
  }

  function doRoadAns(idx: number) {
    if (sel !== null) return;
    audio.stopSpeaking();
    setSel(idx);
    if (timerRef.current) clearTimeout(timerRef.current);
    const correct = idx === shuf!.correct;
    const timeout = idx === -1;
    const d = calculateRoadPoints(correct, timeout, timer, streak, hintUsed);
    setDelta(d);
    setPoints(p => p + d);

    if (correct) {
      setQCorr(c => c + 1);
      setStreak(s => {
        const ns = s + 1;
        if (ns > bestStreak) setBestStreak(ns);
        const label = getStreakLabel(ns);
        if (label) setStreakFlash(label);
        if (ns >= 3) audio.streak(); else audio.correct();
        return ns;
      });
    } else {
      setStreak(0); setCityMissed(true);
      setStreakFlash('');
      if (timeout) audio.timeUp(); else audio.wrong();
    }
    setQAns(a => a + 1);
    // Announce result, then read bonus/synopsis
    if (curQ && shuf) {
      const correctAnswer = shuf.a[shuf.correct];
      const readText = correct ? curQ.bonus : (curQ.synopsis || curQ.bonus);
      if (correct) {
        setTimeout(() => audio.speak(`Great job, you got it right! ... ${readText}`), 800);
      } else {
        setTimeout(() => audio.speak(`The correct answer was: ${correctAnswer}. ... ${readText}`), 800);
      }
    }
  }

  function resolveRoad() {
    audio.stopSpeaking();
    if (!curEdge) return;
    
    const nextQNum = roadQNum + 1;
    
    // If we haven't done all 5 questions yet, launch the next one in the same lane
    if (nextQNum < roadQTotal) {
      setRoadQNum(nextQNum);
      setDelta(null);
      setSel(null);
      setShuf(null);
      setStreakFlash('');
      launchQuestion(curEdge, currentLane);
      return;
    }
    
    // All 5 done — show driving animation and move to next city
    setShowDriving(true);
    setDrivingEdge(curEdge);
    
    setTimeout(() => {
      const dest = curEdge.destination;
      setMiles(m => m + curEdge.miles);
      const driveMin = Math.round((curEdge.miles / (curEdge.avgSpeed || 55)) * 60);
      setTripMinutes(t => t + driveMin);
      setDayMinutes(d => d + driveMin);
      setCurrentNode(dest);
      setCityMissed(false);
      setVisited(v => [...v, dest]);
      setLastRegion(curEdge.region);
      setShowDriving(false);
      setDrivingEdge(null);
      setDelta(null);
      setSel(null);
      setShuf(null);
      setStreakFlash('');
      setCurrentLane(null);
      setRoadQNum(0);

      if (dest === NODES.length - 1) { setPhase('game_over'); return; }

      // 20% hazard chance
      if (Math.random() < 0.2) {
        const h = HAZARD_QUESTIONS[Math.floor(Math.random() * HAZARD_QUESTIONS.length)];
        setHazard(h);
        const hazShuf = shuffleAnswers(h as any);
        setShuf(hazShuf);
        setSel(null);
        setHintUsed(false);
        setHintElim([]);
        audio.hazard();
        setTimeout(() => audio.speakQuestion(h.q, hazShuf.a), 600);
        setPhase('hazard');
        return;
      }
      setPhase('approach');
    }, 2500);
  }

  function startDetour(stopIdx: number) {
    const stops = getExploresForCity(node.name);
    const stop = stops[stopIdx];
    const sh = shuffleAnswers({ q: stop.q, a: stop.a, correct: stop.correct } as any);
    setDetour(stop);
    setShuf(sh);
    setDetourSel(null);
    setTimer(getFatigueTimer());
    setQStartTime(Date.now());
    setHintUsed(false);
    setHintElim([]);
    setVisitedDetours(prev => new Set([...Array.from(prev), `${currentNode}-${stopIdx}`]));
    audio.speakQuestion(stop.q, sh.a);
    setPhase('detour_q');
  }

  function startExcursion(excIdx: number) {
    const excursions = EXCURSIONS[currentNode] || [];
    const exc = excursions[excIdx];
    // Reuse detour flow — Excursions are playable stops just like Discovery/Attractions
    const stop: RawExploreStop = {
      name: exc.name,
      type: 'a',
      explore_type: 'excursion',
      q: exc.question.q,
      a: exc.question.a,
      correct: exc.question.correct,
      bonus: exc.question.bonus,
      synopsis: exc.question.synopsis,
    };
    const sh = shuffleAnswers({ q: stop.q, a: stop.a, correct: stop.correct } as any);
    setDetour(stop);
    setShuf(sh);
    setDetourSel(null);
    setTimer(getFatigueTimer());
    setQStartTime(Date.now());
    setHintUsed(false);
    setHintElim([]);
    setVisitedDetours(prev => new Set([...Array.from(prev), `exc-${currentNode}-${excIdx}`]));
    audio.speakQuestion(stop.q, sh.a);
    setPhase('detour_q');
  }

  function doDetourAns(idx: number) {
    if (detourSel !== null) return;
    audio.stopSpeaking();
    setDetourSel(idx);
    if (timerRef.current) clearTimeout(timerRef.current);
    const correct = idx === shuf!.correct;
    let d = 0;
    if (correct) {
      d = POINTS.DETOUR_CORRECT + timer * POINTS.SPEED_BONUS_PER_SEC;
      setPostcards(p => [...p, detour!.name]);
      audio.postcard();
    } else {
      d = POINTS.DETOUR_WRONG;
      audio.wrong();
    }
    setDelta(d);
    setPoints(p => p + d);
    if (correct) {
      setQCorr(c => c + 1);
      setStreak(s => {
        const ns = s + 1;
        if (ns > bestStreak) setBestStreak(ns);
        const label = getStreakLabel(ns);
        if (label) { setStreakFlash(label); audio.streak(); }
        return ns;
      });
    } else {
      setStreak(0); setCityMissed(true);
      setStreakFlash('');
    }
    setQAns(a => a + 1);
    // Announce result, then read bonus/synopsis
    if (detour && shuf) {
      const correctAnswer = shuf.a[shuf.correct];
      const readText = correct ? detour.bonus : (detour.synopsis || detour.bonus);
      if (correct) {
        setTimeout(() => audio.speak(`Great job, you got it right! ... ${readText}`), 800);
      } else {
        setTimeout(() => audio.speak(`The correct answer was: ${correctAnswer}. ... ${readText}`), 800);
      }
    }
  }

  function resolveDetour() {
    audio.stopSpeaking();
    // Add visit time based on stop type
    if (detour) {
      const stopType = detour.type || (detour.explore_type === 'excursion' ? 'excursion' : 'a');
      const timeToAdd = STOP_TIME[stopType] || STOP_TIME['a'];
      setTripMinutes(t => t + timeToAdd);
      
      // Hotel stay resets daily fatigue — you slept!
      if (stopType === 'h') {
        setDayMinutes(0);
      } else {
        setDayMinutes(d => d + timeToAdd);
      }
    }
    setDetour(null);
    setDetourSel(null);
    setDelta(null);
    setShuf(null);
    setStreakFlash('');
    setPhase('approach');
  }

  function doHazardAns(idx: number) {
    if (sel !== null) return;
    audio.stopSpeaking();
    setSel(idx);
    const correct = idx === shuf!.correct;
    const d = correct ? 0 : -(hazard?.penalty || 100);
    if (correct) audio.correct(); else audio.wrong();
    setDelta(d);
    setPoints(p => p + d);
    setQAns(a => a + 1);
    if (correct) setQCorr(c => c + 1);
    // Announce result
    if (hazard && shuf) {
      const correctAnswer = shuf.a[shuf.correct];
      const readText = hazard.synopsis || '';
      if (correct) {
        setTimeout(() => audio.speak(`Nice work, no damage! ... ${readText}`), 800);
      } else {
        setTimeout(() => audio.speak(`The correct answer was: ${correctAnswer}. ... ${readText}`), 800);
      }
    }
  }

  function resolveHazard() {
    audio.stopSpeaking();
    setHazard(null);
    setSel(null);
    setDelta(null);
    setShuf(null);
    setStreakFlash('');
    setPhase('approach');
  }

  function enterRest() {
    const edgeRegions = EDGES.filter(e => e.from === currentNode || e.to === currentNode);
    const region = edgeRegions[0]?.region || '';
    const pool = getRestQuestionsForRegion(region);
    setRestPool(pool);
    setRestIdx(0);
    setRestSel(null);
    setRestPts(0);
    setRestedNodes(prev => new Set([...Array.from(prev), currentNode]));
    setTripMinutes(t => t + STOP_TIME['rest']);
    setDayMinutes(d => Math.max(0, d - 120)); // Rest stop takes the edge off — 2 hours of fatigue relief
    setPhase('rest_stop');
  }

  function startRestQ(idx: number) {
    const sh = shuffleAnswers(restPool[idx] as any);
    setRestIdx(idx);
    setShuf(sh);
    setRestSel(null);
    audio.speakQuestion(restPool[idx].q, sh.a);
    setPhase('rest_q');
  }

  function doRestAns(idx: number) {
    if (restSel !== null) return;
    audio.stopSpeaking();
    setRestSel(idx);
    const correct = idx === shuf!.correct;
    const d = correct ? POINTS.REST_CORRECT : POINTS.REST_WRONG;
    setRestPts(p => p + d);
    setPoints(p => p + d);
    setUsedQs(prev => new Set([...Array.from(prev), `rest-${currentNode}-${restIdx}`]));
    if (correct) { setQCorr(c => c + 1); audio.correct(); }
    setQAns(a => a + 1);
    // Announce result
    const rq = restPool[restIdx];
    if (rq && shuf) {
      const correctAnswer = shuf.a[shuf.correct];
      const readText = correct ? rq.bonus : (rq.synopsis || rq.bonus);
      if (correct) {
        setTimeout(() => audio.speak(`That's right! ... ${readText}`), 800);
      } else {
        setTimeout(() => audio.speak(`The correct answer was: ${correctAnswer}. ... ${readText}`), 800);
      }
    }
  }

  function useHint() {
    if (hintUsed || !shuf) return;
    setHintUsed(true);
    const wrong = shuf.a.map((_, i) => i).filter(i => i !== shuf.correct);
    wrong.sort(() => Math.random() - 0.5);
    setHintElim([wrong[0], wrong[1]]);
  }

  // ============ RENDER ============

  // ---- HOME SCREEN ----
  if (phase === 'home') {
    const pctComplete = gameStarted ? Math.round((visited.length / NODES.length) * 100) : 0;
    const tripTime = formatTripTime(tripMinutes);
    return (
      <div className="min-h-screen game-bg pb-10">
        {/* Header */}
        <div className="deco-bg px-4 pt-5 pb-4 rounded-b-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-amber-400 font-mono text-[9px] tracking-[5px]">OPEN ROAD TRIVIA</div>
              <h1 className="text-white text-xl font-bold mt-1">Route 66 Edition</h1>
              <div className="text-gray-400 text-xs mt-0.5">Chicago to Santa Monica &middot; 2,448 miles</div>
            </div>
            <MuteBtn />
          </div>
        </div>

        {gameStarted ? (
          <div className="px-4 mt-4">
            {/* Trip progress card */}
            <div className="card p-4 mb-3">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-gray-900 text-base font-bold">{node.name}, {node.state}</div>
                  <div className="text-gray-500 text-xs">{miles} miles driven &middot; {pctComplete}% complete</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-500 text-lg font-bold">{points.toLocaleString()}</div>
                  <div className="text-gray-400 text-[9px] font-mono">POINTS</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: pctComplete + '%' }} />
              </div>

              {/* Trip stats */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-gray-900 text-sm font-bold">{visited.length}</div>
                  <div className="text-gray-400 text-[8px] font-mono">CITIES</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-900 text-sm font-bold">{postcards.length}</div>
                  <div className="text-gray-400 text-[8px] font-mono">POSTCARDS</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-900 text-sm font-bold">{accuracy}%</div>
                  <div className="text-gray-400 text-[8px] font-mono">ACCURACY</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-900 text-sm font-bold">{bestStreak}</div>
                  <div className="text-gray-400 text-[8px] font-mono">BEST STREAK</div>
                </div>
              </div>

              {/* Trip time */}
              {tripMinutes > 0 && (
                <div className="text-center mt-2 text-gray-400 text-[10px] font-mono">
                  Day {tripTime.days} &middot; {tripTime.display}
                </div>
              )}
            </div>

            <button onClick={() => setPhase('approach')} className="btn-primary w-full text-center mb-2">
              Continue Driving
            </button>

            {/* New Game option */}
            <button onClick={() => { clearSave(); setGameStarted(false); setPhase('home'); }} className="w-full text-center text-gray-400 text-xs py-2">
              Start New Trip
            </button>
          </div>
        ) : (
          <div className="mt-0">
            {/* Randomized hero image */}
            <div className="relative overflow-hidden" style={{ height: 360 }}>
              <img
                src={`/images/opening/opening-${Math.floor(Math.random() * 12)}.jpg`}
                alt="Route 66"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            <div className="px-4 mt-4">
            {/* First time — welcome */}
            <div className="card p-4 mb-4 text-center">
              <div className="text-gray-900 text-lg font-bold">Ready for the open road?</div>
              <div className="text-gray-500 text-sm mt-1 leading-relaxed">
                Answer trivia questions to drive from Chicago to Santa Monica on historic Route 66. 
                Explore museums, eat at famous diners, stay in legendary hotels, and collect postcards along the way.
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={startGame} className="btn-primary w-full text-center text-lg py-4">
                Start Route 66
              </button>
            </div>

            {/* How it works */}
            <div className="mt-6 space-y-2">
              <div className="text-gray-500 font-mono text-[9px] tracking-widest">HOW IT WORKS</div>
              <div className="card p-3 flex items-center gap-3">
                <span className="text-xl">🗺️</span>
                <div>
                  <div className="text-gray-900 text-sm font-semibold">Pick Your Lane</div>
                  <div className="text-gray-500 text-xs">Choose a trivia category before each road question</div>
                </div>
              </div>
              <div className="card p-3 flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <div className="text-gray-900 text-sm font-semibold">Explore Every City</div>
                  <div className="text-gray-500 text-xs">Visit museums, attractions, hotels, and restaurants for bonus points</div>
                </div>
              </div>
              <div className="card p-3 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="text-gray-900 text-sm font-semibold">Master the Route</div>
                  <div className="text-gray-500 text-xs">Get every answer right in a city to earn City Mastered status</div>
                </div>
              </div>
              <div className="card p-3 flex items-center gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <div className="text-gray-900 text-sm font-semibold">Beat the Clock</div>
                  <div className="text-gray-500 text-xs">25 seconds per question. Fast answers earn speed bonuses.</div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Postcards */}
        {postcards.length > 0 && (
          <div className="px-4 mt-3">
            <div className="text-gray-500 font-mono text-[9px] tracking-widest mb-2">POSTCARDS ({postcards.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {postcards.map((p, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                  <span className="text-amber-800 text-[11px] font-semibold">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- APPROACH SCREEN ----
  if (phase === 'approach') {
    const stops = getExploresForCity(node.name);
    const makeStopList = (typeCode: string) => stops
      .filter(s => s.type === typeCode)
      .map(s => ({ ...s, idx: stops.indexOf(s), done: visitedDetours.has(`${currentNode}-${stops.indexOf(s)}`) }));
    const discStops = makeStopList('d');
    const attrStops = makeStopList('a');
    const hotelStops = makeStopList('h');
    const restStops = makeStopList('r');
    const excursions = EXCURSIONS[currentNode] || [];
    const edgeRegions = EDGES.filter(e => e.from === currentNode || e.to === currentNode);
    const curRegion = edgeRegions[0]?.region || '';
    const isNewRegion = curRegion && curRegion !== lastRegion && lastRegion !== '';
    const hasRest = node.isCity && getRestQuestionsForRegion(curRegion).length > 0 && !restedNodes.has(currentNode);

    // City mastery progress — includes Discovery, Attractions, Excursions, Rest
    const totalStops = stops.length;
    const doneStops = stops.filter((_, i) => visitedDetours.has(`${currentNode}-${i}`)).length;
    const doneExc = excursions.filter((_, i) => visitedDetours.has(`exc-${currentNode}-${i}`)).length;
    const restDone = restedNodes.has(currentNode);
    const totalAct = totalStops + excursions.length + (hasRest || restDone ? 1 : 0);
    const doneAct = doneStops + doneExc + (restDone ? 1 : 0);
    const allDone = totalAct > 0 && doneAct === totalAct;

    return (
      <div className={`min-h-screen game-bg-${node.scene || 'desert'} pb-10`}>
        {/* City header - image or Art Deco fallback */}
        <div className="arrival-pulse">
        <LocationHeader
          size="full"
          label="NOW ARRIVING IN"
          title={node.name}
          subtitle={node.state}
          detail={node.desc}
          meta={`MILE ${miles} | ${visited.length} of ${NODES.length} CITIES`}
          scene={node.scene}
          imageSrc={img(getCityImage(node.name, node.state))}
        />
        </div>

        {/* Region transition banner */}
        {isNewRegion && (
          <LocationHeader
            size="mini"
            label="ENTERING"
            title={curRegion}
            imageSrc={img(getRegionImage(curRegion))}
            scene={node.scene}
          />
        )}

        {/* Map */}
        <div className="mt-2">
          <GameMap currentNode={currentNode} visitedNodes={visited} onJumpTo={jumpToCity} />
        </div>

        <StatsBar points={points} miles={miles} accuracy={accuracy} streak={streak} />

        {/* Trip info bar */}
        <div className="mx-3 mb-1 flex justify-between items-center">
          <span className="text-gray-400 text-[10px] font-mono">
            {tripMinutes > 0 ? `Day ${formatTripTime(tripMinutes).days} · ${formatTripTime(tripMinutes).display}` : 'Day 1'}
          </span>
          <span className="text-amber-500 text-[10px] font-mono">
            {postcards.length > 0 ? `${postcards.length} postcards` : ''}
          </span>
        </div>

        {/* Streak indicator */}
        {streak >= 5 && (
          <div className="mx-3 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-500 text-xs font-mono">CRUISING +50 next correct</span>
          </div>
        )}

        {/* City progress — compact bar below stats */}
        {totalAct > 0 && (
          <div className="mx-3 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-semibold ${allDone ? (perfectCities.has(currentNode) || !cityMissed ? 'text-green-600' : 'text-blue-500') : 'text-gray-500'}`}>
                {allDone ? (perfectCities.has(currentNode) || !cityMissed ? 'City Mastered!' : 'City Completed!') : `${doneAct}/${totalAct} explored`}
              </span>
              <span className="text-gray-400 text-[9px] font-mono">{totalAct > 0 ? Math.round((doneAct / totalAct) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${allDone ? (perfectCities.has(currentNode) || !cityMissed ? 'bg-green-500' : 'bg-blue-400') : 'bg-amber-400'}`}
                style={{ width: `${totalAct > 0 ? Math.round((doneAct / totalAct) * 100) : 0}%` }} />
            </div>
          </div>
        )}

        {/* Content sections */}
        <div className="px-3 space-y-3">

          {/* Discovery */}
          {discStops.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-amber-500 text-base font-bold">Discovery</span>
                <span className="text-gray-400 text-[11px] italic">Museums, landmarks, and historic sites worth exploring</span>
              </div>
              <div className="space-y-1.5">
                {discStops.map(item => (
                  <button key={item.idx} onClick={() => !item.done && startDetour(item.idx)} disabled={item.done}
                    className={`card w-full text-left ${item.done ? 'opacity-40' : 'hover:border-green-300'}`}>
                    <div className="flex items-center gap-2.5">
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill={item.done ? '#d0d5dd' : STOP_LABELS['d'].bgColor} />
                        <circle cx="10" cy="10" r="3.5" fill={item.done ? '#6b7280' : STOP_LABELS['d'].dotColor} />
                      </svg>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${item.done ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</div>
                        <div className="text-gray-500 text-[10px]">{item.done ? 'Visited' : (item.desc || '+200 pts')}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attractions */}
          {attrStops.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-amber-500 text-base font-bold">Attractions</span>
                <span className="text-gray-400 text-[11px] italic">Roadside oddities and can't-miss photo stops</span>
              </div>
              <div className="space-y-1.5">
                {attrStops.map(item => (
                  <button key={item.idx} onClick={() => !item.done && startDetour(item.idx)} disabled={item.done}
                    className={`card w-full text-left ${item.done ? 'opacity-40' : 'hover:border-fuchsia-300'}`}>
                    <div className="flex items-center gap-2.5">
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill={item.done ? '#d0d5dd' : STOP_LABELS['a'].bgColor} />
                        <circle cx="10" cy="10" r="3.5" fill={item.done ? '#6b7280' : STOP_LABELS['a'].dotColor} />
                      </svg>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${item.done ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</div>
                        <div className="text-gray-500 text-[10px]">{item.done ? 'Visited' : (item.desc || '+200 pts')}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Excursions */}
          {excursions.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-amber-500 text-base font-bold">Excursions</span>
                <span className="text-gray-400 text-[11px] italic">Side trips to nearby destinations off the main route</span>
              </div>
              <div className="space-y-1.5">
                {excursions.map((exc, i) => {
                  const excDone = visitedDetours.has(`exc-${currentNode}-${i}`);
                  return (
                    <button key={i} onClick={() => !excDone && startExcursion(i)} disabled={excDone}
                      className={`card w-full text-left bg-amber-50 border-amber-200 ${excDone ? 'opacity-40' : 'hover:border-amber-400'}`}>
                      <div className="flex items-center gap-2.5">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="8" fill={excDone ? '#d0d5dd' : '#fef3c7'} />
                          <circle cx="10" cy="10" r="3.5" fill={excDone ? '#6b7280' : '#f59e0b'} />
                        </svg>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-bold ${excDone ? 'text-gray-500' : 'text-amber-900'}`}>{exc.name}</span>
                            <span className="text-amber-600 text-[9px] font-mono">{exc.dist}</span>
                          </div>
                          <div className="text-gray-500 text-[10px] mt-0.5">{excDone ? 'Visited' : '+200 pts · ' + exc.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sunset warning — right before Hotels */}
          {isSunset && hotelStops.some(h => !h.done) && (
            <div className="bg-indigo-900 rounded-xl p-3 text-center">
              <div className="text-indigo-300 font-mono text-[8px] tracking-widest">THE SUN IS SETTING</div>
              <div className="text-white text-sm font-bold mt-0.5">Time to find a place for the night.</div>
              {isFatigued && (
                <div className="text-amber-300 text-[10px] mt-1">Fatigue penalty active — timer reduced by {dayMinutes / 60 >= FATIGUE.EXHAUSTED_HOURS ? FATIGUE.TIMER_PENALTY_EXHAUSTED : FATIGUE.TIMER_PENALTY_TIRED}s</div>
              )}
            </div>
          )}

          {/* Hotels */}
          {hotelStops.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-amber-500 text-base font-bold">{isSunset ? 'Stay the Night' : 'Hotels'}</span>
                <span className="text-gray-400 text-[11px] italic">{isSunset ? 'Find a place to rest before the road gets dark' : 'Historic lodges and landmark inns'}</span>
              </div>
              <div className="space-y-1.5">
                {hotelStops.map(item => (
                  <button key={item.idx} onClick={() => !item.done && startDetour(item.idx)} disabled={item.done}
                    className={`card w-full text-left ${item.done ? 'opacity-40' : isSunset ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'hover:border-indigo-300'}`}>
                    <div className="flex items-center gap-2.5">
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill={item.done ? '#d0d5dd' : STOP_LABELS['h'].bgColor} />
                        <circle cx="10" cy="10" r="3.5" fill={item.done ? '#6b7280' : STOP_LABELS['h'].dotColor} />
                      </svg>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${item.done ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</div>
                        <div className="text-gray-500 text-[10px]">{item.done ? 'Visited' : (item.desc || '+200 pts')}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Restaurants */}
          {restStops.length > 0 && (
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-amber-500 text-base font-bold">Restaurants</span>
                <span className="text-gray-400 text-[11px] italic">Famous diners and local food you have to try</span>
              </div>
              <div className="space-y-1.5">
                {restStops.map(item => (
                  <button key={item.idx} onClick={() => !item.done && startDetour(item.idx)} disabled={item.done}
                    className={`card w-full text-left ${item.done ? 'opacity-40' : 'hover:border-orange-300'}`}>
                    <div className="flex items-center gap-2.5">
                      <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill={item.done ? '#d0d5dd' : STOP_LABELS['r'].bgColor} />
                        <circle cx="10" cy="10" r="3.5" fill={item.done ? '#6b7280' : STOP_LABELS['r'].dotColor} />
                      </svg>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${item.done ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</div>
                        <div className="text-gray-500 text-[10px]">{item.done ? 'Visited' : (item.desc || '+200 pts')}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rest Stop */}
          {hasRest && (
            <button onClick={enterRest} className="card w-full text-left hover:border-blue-300">
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#bfdbfe60" />
                  <circle cx="10" cy="10" r="3.5" fill="#60a5fa" />
                </svg>
                <div className="flex-1">
                  <div className="text-blue-600 text-sm font-bold">REST STOP: {node.name}</div>
                  <div className="text-gray-500 text-[10px]">Bonus points | No penalty</div>
                </div>
              </div>
            </button>
          )}

          {/* Choose Your Road */}
          <div>
            <div className="text-gray-500 font-mono text-[9px] tracking-widest mb-1.5">CHOOSE YOUR ROAD</div>
            <div className="space-y-1.5">
              {availEdges.map((edge, i) => {
                const dest = NODES[edge.destination];
                const revisit = visited.includes(edge.destination);
                return (
                  <button key={i} onClick={() => selectEdge(edge)} className="card w-full text-left hover:border-amber-300">
                    <div className="flex items-center gap-2.5">
                      <span className="text-amber-500 text-xl font-black">&gt;</span>
                      <div className="flex-1">
                        <div className="text-gray-900 text-sm font-semibold">
                          {dest.name}, {dest.state}{revisit ? ' (visited)' : ''}
                        </div>
                        <div className="text-gray-500 text-[10px] font-mono">{edge.route} | {edge.miles} mi | ~{Math.round((edge.miles / (edge.avgSpeed || 55)) * 60)} min at {edge.avgSpeed || 55} mph</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Off Ramp */}
          <div className="flex justify-between items-center mt-2">
            <MuteBtn />
            <button onClick={() => setPhase('home')} className="text-gray-400 text-xs border border-gray-200 rounded-xl py-2.5 px-4">
              Off Ramp (Save and Exit)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- PICK YOUR LANE ----
  if (phase === 'pick_lane' && curEdge) {
    const destNode = NODES[curEdge.destination];
    const catColors: Record<string, string> = {
      'Landmarks & Places': '#f59e0b', 'History & Events': '#60a5fa',
      'Culture & Traditions': '#a78bfa', 'Nature & Geography': '#10b981',
      'People & Biography': '#f472b6', 'Arts & Entertainment': '#e879f9',
      'Economy & Industry': '#059669', 'Books & Ideas': '#93c5fd',
    };
    const catIcons: Record<string, string> = {
      'Landmarks & Places': '🏛️', 'History & Events': '📜',
      'Culture & Traditions': '🎭', 'Nature & Geography': '🌿',
      'People & Biography': '👤', 'Arts & Entertainment': '🎸',
      'Economy & Industry': '⚙️', 'Books & Ideas': '📚',
    };
    const driveTime = Math.round((curEdge.miles / (curEdge.avgSpeed || 55)) * 60);

    return (
      <div className={`min-h-screen game-bg-${destNode.scene || 'desert'} pb-10`}>
        <LocationHeader size="compact" label="HEADING TO" title={`${destNode.name}, ${destNode.state}`}
          subtitle={`${curEdge.route} | ${curEdge.miles} mi | ~${driveTime} min`}
          scene={destNode.scene} imageSrc={img(getCityImage(destNode.name, destNode.state))} />
        <div className="px-4 pt-5 text-center">
          <div className="text-gray-400 font-mono text-[8px] tracking-[4px] mb-1">CHOOSE YOUR CATEGORY</div>
          <div className="text-gray-900 text-lg font-bold mb-4">Pick Your Lane</div>
          <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
            {laneChoices.map((cat, i) => {
              const c = catColors[cat] || '#94a3b8';
              const icon = catIcons[cat] || '❓';
              return (
                <button key={i} onClick={() => pickLane(cat)}
                  className="card text-left hover:shadow-md transition-all p-4" style={{ borderColor: c + '50', borderWidth: 2 }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span style={{ color: c }} className="text-base font-bold">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---- ROAD QUESTION ----
  if (phase === 'road_q' && shuf && curQ && curEdge) {
    const answered = sel !== null;
    const wasCorrect = answered && sel === shuf.correct;
    const wasWrong = answered && sel !== null && sel !== -1 && sel !== shuf.correct;
    const wasTimeout = answered && sel === -1;
    const bgCls = wasCorrect ? 'game-bg-correct' : wasWrong ? 'game-bg-wrong' : wasTimeout ? 'game-bg-timeout' : 'game-bg';
    const responseMs = answered ? Date.now() - qStartTime : 0;
    const speed = getSpeedRating(responseMs);
    const destNode = NODES[curEdge.destination];

    return (
      <div className={`min-h-screen ${bgCls} pb-10`}>
        <LocationHeader size="medium" label={curEdge.region.toUpperCase()}
          title={`${destNode.name}, ${destNode.state}`}
          subtitle={`${curQ.category || 'Road Question'} · Question ${roadQNum + 1} of ${roadQTotal}`}
          scene={node.scene} imageSrc={img(getCityImage(destNode.name, destNode.state))} />

        <div className="flex justify-between items-center px-3.5 py-1.5">
          <StatsBar points={points} miles={miles} accuracy={accuracy} streak={streak} />
          <TimerRing time={timer} maxTime={getFatigueTimer()} />
        </div>

        <div className="px-3.5">
          {/* Category badge */}
          {curQ.category && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-600 text-[10px] font-mono font-bold bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5">
                {curQ.category}
              </span>
              {isFatigued && <span className="text-red-400 text-[9px] font-mono">FATIGUED</span>}
            </div>
          )}
          <div className="bg-white rounded-xl p-3.5 mb-3 border border-gray-200 shadow-sm">
            <h2 className="text-gray-900 text-base font-semibold leading-relaxed">{curQ.q}</h2>
          </div>

          <AnswerButton answers={shuf.a} correctIndex={shuf.correct} selectedIndex={sel} onPick={doRoadAns} hintEliminated={hintElim} />

          {/* Result feedback */}
          {wasCorrect && <div className="text-center py-2 text-lg font-black text-green-600 result-correct">{getResultMessage('correct', streak)}</div>}
          {wasWrong && <div className="text-center py-2 text-base font-semibold text-red-400 result-wrong">{getResultMessage('wrong')}</div>}
          {wasTimeout && <div className="text-center py-2 text-base font-semibold text-amber-500 result-wrong">{getResultMessage('timeout')}</div>}

          {/* Streak flash */}
          {answered && wasCorrect && streakFlash && (
            <div className="streak-banner my-2">{streakFlash}</div>
          )}

          {/* Speed + points */}
          {answered && (
            <div className="text-center text-sm font-mono text-gray-500 mb-1">
              {(responseMs / 1000).toFixed(1)}s &middot; <span style={{ color: speed.color }}>{speed.label}</span>
              {delta !== null && <span className={delta >= 0 ? ' text-green-600' : ' text-red-500'}> {delta >= 0 ? '+' : ''}{delta} pts</span>}
            </div>
          )}

          {/* Bonus / Synopsis with image */}
          {answered && wasCorrect && <InfoBox type="bonus" text={curQ.bonus} imageSrc={img(getStopImage(destNode.name))} imageAlt={destNode.name} />}
          {answered && (wasWrong || wasTimeout) && <InfoBox type="story" text={curQ.synopsis || curQ.bonus} imageSrc={img(getStopImage(destNode.name))} imageAlt={destNode.name} />}

          {/* Action buttons / Driving animation */}
          {answered && !showDriving && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => { const q = curQ?.q || detour?.name || "Route 66"; window.open("https://en.wikipedia.org/wiki/Special:Search/" + encodeURIComponent(q.split(" ").slice(0, 6).join(" ")), "_blank"); }} className="btn-outline flex-1">Learn More</button>
              <button onClick={resolveRoad} className="btn-primary flex-1">
                {roadQNum + 1 < roadQTotal ? `Next Question (${roadQNum + 2} of ${roadQTotal})` : `Continue to ${destNode.name}`}
              </button>
            </div>
          )}

          {/* Driving animation strip — car slides across regional scenic background */}
          {showDriving && drivingEdge && (() => {
            const regionSlug = drivingEdge.region.toLowerCase().replace(/['']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const bgImg = `/images/driving-${regionSlug}.png`;
            return (
            <div className="mt-3 rounded-xl overflow-hidden" style={{ height: 80 }}>
              <div className="relative h-full">
                {/* Regional scenic background */}
                <div className="absolute inset-0 bg-gray-900">
                  <img src={bgImg} alt="" className="w-full h-full object-cover opacity-70"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                
                {/* Road line overlay */}
                <div className="absolute inset-x-0 top-[60%] h-px bg-white/20" />
                <div className="absolute inset-x-0 top-[62%] flex gap-2 px-4">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="h-px flex-1 bg-white/15" />
                  ))}
                </div>
                
                {/* Car image sliding across */}
                <div className="absolute" style={{ 
                  animation: 'car-drive 2.5s ease-in-out forwards',
                  top: '15%',
                }}>
                  <img src="/images/driving-car.png" alt="Driving" width="120" height="60" 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))' }}
                  />
                </div>
                
                {/* Route info — bottom bar */}
                <div className="absolute bottom-0 inset-x-0 bg-black/50 px-3 py-1 flex justify-between items-center">
                  <span className="text-white/70 text-[9px] font-mono">
                    {drivingEdge.route} · {drivingEdge.miles} mi · {drivingEdge.avgSpeed || 55} mph
                  </span>
                  <span className="text-amber-400 text-[10px] font-bold" style={{ animation: 'fade-in 1s ease-in 1.5s both' }}>
                    {NODES[drivingEdge.destination].name} →
                  </span>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Hint button */}
          {!answered && !hintUsed && (
            <button onClick={useHint} className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-600 text-sm font-semibold flex items-center justify-center gap-2">
              <span className="text-base">💡</span> 50/50 Hint <span className="text-[10px] font-normal text-amber-400">(half points)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- EXPLORE QUESTION ----
  if (phase === 'detour_q' && shuf && detour) {
    const answered = detourSel !== null;
    const wasCorrect = answered && detourSel === shuf.correct;
    const wasWrong = answered && detourSel !== null && detourSel !== -1 && detourSel !== shuf.correct;
    const wasTimeout = answered && detourSel === -1;
    const stopTypeLabels: Record<string, string> = { d: 'DISCOVERY', a: 'ATTRACTION', h: 'HOTEL', r: 'RESTAURANT', excursion: 'EXCURSION' };
    const stopLabel = stopTypeLabels[detour.type] || stopTypeLabels[detour.explore_type] || 'EXPLORE';

    return (
      <div className={`min-h-screen game-bg-${node.scene || "desert"} pb-10`}>
        <LocationHeader size="compact" label={stopLabel}
          title={`${node.name}, ${node.state}`} subtitle={detour.name}
          scene={node.scene} imageSrc={img(getStopImage(detour.name))} />

        <div className="flex justify-between items-center px-3.5 py-1.5">
          <span className="text-gray-500 text-[10px]">+200 pts for correct</span>
          <TimerRing time={timer} maxTime={getFatigueTimer()} size={40} />
        </div>

        <div className="px-3.5">
          <h2 className="text-gray-900 text-base font-semibold leading-relaxed mb-3">{detour.q}</h2>
          <AnswerButton answers={shuf.a} correctIndex={shuf.correct} selectedIndex={detourSel} onPick={doDetourAns} />

          {wasCorrect && <div className="text-center py-2 text-lg font-black text-green-600 result-correct">{getResultMessage('correct', streak)} +{delta} pts</div>}
          {wasWrong && <div className="text-center py-2 text-base font-semibold text-red-400 result-wrong">{getResultMessage('wrong')}</div>}
          {wasTimeout && <div className="text-center py-2 text-base font-semibold text-amber-500 result-wrong">{getResultMessage('timeout')}</div>}

          {answered && wasCorrect && streakFlash && <div className="streak-banner my-2">{streakFlash}</div>}
          {answered && postcards.includes(detour.name) && (
            <div className="text-center text-amber-500 text-sm font-semibold mt-1">Postcard earned: {detour.name}</div>
          )}

          {answered && wasCorrect && <InfoBox type="bonus" text={detour.bonus} imageSrc={img(getStopImage(detour.name))} imageAlt={detour.name} />}
          {answered && !wasCorrect && <InfoBox type="story" text={detour.synopsis} imageSrc={img(getStopImage(detour.name))} imageAlt={detour.name} />}

          {answered && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => { const q = curQ?.q || detour?.name || "Route 66"; window.open("https://en.wikipedia.org/wiki/Special:Search/" + encodeURIComponent(q.split(" ").slice(0, 6).join(" ")), "_blank"); }} className="btn-outline flex-1">Learn More</button>
              <button onClick={resolveDetour} className="btn-primary flex-1">Back to Route 66</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- HAZARD ----
  if (phase === 'hazard' && shuf && hazard) {
    const answered = sel !== null;
    const wasCorrect = answered && sel === shuf.correct;
    const hazardIcons: Record<string, string> = {
      'Construction Zone': '🚧', 'Speed Trap': '🚨', 'Flat Tire': '💨', 'Weather Delay': '⛈️',
    };
    const icon = hazardIcons[hazard.type] || '⚠️';

    return (
      <div className={`min-h-screen game-bg-${node.scene || "desert"} pb-10`}>
        {/* Hazard warning banner */}
        <div className="bg-red-900 px-4 py-3 text-center">
          <div className="text-red-300 font-mono text-[8px] tracking-[4px]">ROAD HAZARD</div>
          <div className="text-white text-lg font-bold mt-0.5">{icon} {hazard.type}</div>
          <div className="text-red-200 text-xs italic mt-0.5">{hazard.message}</div>
        </div>

        <div className="px-3.5 pt-4">
          {/* Penalty warning */}
          {!answered && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 text-center">
              <span className="text-red-600 text-xs font-semibold">Answer correctly to avoid -{hazard.penalty} pts penalty</span>
            </div>
          )}

          {/* Question */}
          <div className="bg-white rounded-xl p-3.5 mb-3 border border-gray-200 shadow-sm">
            <h3 className="text-gray-900 text-base font-semibold leading-relaxed">{hazard.q}</h3>
          </div>

          <AnswerButton answers={shuf.a} correctIndex={shuf.correct} selectedIndex={sel} onPick={doHazardAns} />

          {answered && wasCorrect && <div className="text-center py-3 text-lg font-black text-green-600 result-correct">No damage! Quick thinking.</div>}
          {answered && !wasCorrect && <div className="text-center py-3"><div className="text-red-400 text-base font-semibold">{getResultMessage('wrong')}</div><div className="text-red-500 text-sm font-mono mt-1">-{hazard.penalty} pts</div></div>}

          {answered && hazard.synopsis && <InfoBox type="story" text={hazard.synopsis} />}

          {answered && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => { const q = hazard?.q || "Route 66"; window.open("https://en.wikipedia.org/wiki/Special:Search/" + encodeURIComponent(q.split(" ").slice(0, 6).join(" ")), "_blank"); }} className="btn-outline flex-1">Learn More</button>
              <button onClick={resolveHazard} className="btn-primary flex-1">Drive On</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- REST STOP ----
  if (phase === 'rest_stop') {
    const allRestDone = restPool.every((_, i) => usedQs.has(`rest-${currentNode}-${i}`));
    return (
      <div className={`min-h-screen game-bg-${node.scene || 'desert'} pb-10`}>
        <LocationHeader size="medium" label="REST STOP"
          title={`${node.name}, ${node.state}`} subtitle={node.desc}
          scene={node.scene} imageSrc={img(getCityImage(node.name, node.state))} />

        <div className="px-3.5 pt-3">
          {/* Rest stop info card */}
          <div className="card p-3 mb-3 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">☕</span>
              <div>
                <div className="text-blue-800 text-sm font-bold">Take a breather</div>
                <div className="text-blue-600 text-xs">No penalty for wrong answers. Bonus points for correct.</div>
                {isFatigued && <div className="text-green-600 text-[10px] mt-0.5">Fatigue reduced by 2 hours</div>}
              </div>
            </div>
          </div>

          {restPts > 0 && (
            <div className="text-center text-green-600 text-sm font-bold font-mono mb-2">Rest stop bonus: +{restPts} pts</div>
          )}

          <div className="space-y-1.5">
            {restPool.map((q, i) => {
              const done = usedQs.has(`rest-${currentNode}-${i}`);
              return (
                <button key={i} onClick={() => !done && startRestQ(i)} disabled={done}
                  className={`card w-full text-left ${done ? 'opacity-40' : 'hover:border-blue-300'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      done ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 text-sm font-semibold">{done ? 'Answered' : `Question ${i + 1}`}</div>
                      <div className="text-gray-500 text-[10px]">{done ? '' : '+75 pts if correct · No penalty'}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-4">
            <button onClick={() => setPhase('approach')} className="btn-primary">
              {allRestDone ? 'All done! Back to Route 66' : 'Back to Route 66'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- REST QUESTION ----
  if (phase === 'rest_q' && shuf) {
    const rq = restPool[restIdx];
    const answered = restSel !== null;
    const wasCorrect = answered && restSel === shuf.correct;

    return (
      <div className={`min-h-screen game-bg-${node.scene || "desert"} pb-10`}>
        <DecoHeader size="compact" label="REST STOP" title={`${node.name}, ${node.state}`}
          subtitle={`Question ${restIdx + 1} of ${restPool.length}`} />
        <div className="flex justify-between items-center px-3.5 py-1.5">
          <span className="text-gray-500 text-[10px]">+75 pts if correct | No penalty</span>
          <span className="text-blue-600 text-[10px] font-mono">No timer</span>
        </div>
        <div className="px-3.5">
          <h2 className="text-gray-900 text-base font-semibold leading-relaxed mb-3">{rq.q}</h2>
          <AnswerButton answers={shuf.a} correctIndex={shuf.correct} selectedIndex={restSel} onPick={doRestAns} />
          {answered && (
            <div className={`text-center py-2 text-lg font-black font-mono ${wasCorrect ? 'text-green-600' : 'text-gray-400'}`}>
              {wasCorrect ? getResultMessage('correct') + ' +75 pts' : 'No penalty! ' + getResultMessage('wrong')}
            </div>
          )}
          {answered && wasCorrect && <InfoBox type="bonus" text={rq.bonus} />}
          {answered && !wasCorrect && <InfoBox type="story" text={rq.synopsis || rq.bonus} />}
          {answered && (
            <div className="text-center mt-3">
              <button onClick={() => { setRestSel(null); setShuf(null); setPhase('rest_stop'); }} className="btn-primary">
                Back to Rest Stop
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- LIGHTNING ROUND ----
  if (phase === 'lightning' && shuf && lightningPool.length > 0) {
    const lq = lightningPool[lightningIdx];
    const answered = lightningSel !== null;
    const wasCorrect = answered && lightningSel === shuf.correct;
    const isLast = lightningIdx >= lightningTotal - 1;

    function doLightningAns(idx: number) {
      if (lightningSel !== null) return;
      audio.stopSpeaking();
      setLightningSel(idx);
      if (timerRef.current) clearTimeout(timerRef.current);
      const correct = idx === shuf!.correct;
      if (correct) {
        setLightningCorrect(c => c + 1);
        setPoints(p => p + 50);
        audio.correct();
        setTimeout(() => audio.speak('Correct!'), 400);
      } else {
        audio.wrong();
        const correctAnswer = shuf!.a[shuf!.correct];
        setTimeout(() => audio.speak(`The answer was: ${correctAnswer}`), 400);
      }
      setQAns(a => a + 1);
      if (correct) setQCorr(c => c + 1);
    }

    function nextLightning() {
      audio.stopSpeaking();
      if (isLast) {
        // Lightning round complete — proceed to Chicago
        setVisited([0]);
        setPhase('approach');
        return;
      }
      const next = lightningIdx + 1;
      setLightningIdx(next);
      setLightningSel(null);
      const sh = shuffleAnswers(lightningPool[next] as any);
      setShuf(sh);
      setTimer(15);
      setQStartTime(Date.now());
      audio.speakQuestion(lightningPool[next].q, sh.a);
    }

    return (
      <div className={`min-h-screen pb-10 ${answered ? (wasCorrect ? 'bg-green-50' : 'bg-red-50') : 'bg-amber-50'}`}>
        {/* Lightning round header */}
        <div className="bg-amber-500 px-4 py-3 text-center">
          <div className="text-amber-900 font-mono text-[8px] tracking-[4px]">LIGHTNING ROUND</div>
          <div className="text-white text-lg font-bold">Route 66 Knowledge Check</div>
          <div className="text-amber-100 text-xs mt-0.5">Question {lightningIdx + 1} of {lightningTotal} · {lightningCorrect} correct</div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {Array.from({ length: lightningTotal }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${
              i < lightningIdx ? 'bg-amber-400' :
              i === lightningIdx ? 'bg-amber-600 ring-2 ring-amber-300' :
              'bg-gray-200'
            }`} />
          ))}
        </div>

        {/* Timer */}
        <div className="flex justify-end px-4 mb-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-black font-mono border-2 ${
            timer <= 5 ? 'text-red-500 border-red-500' : 'text-gray-900 border-gray-300'
          }`}>{timer}</div>
        </div>

        <div className="px-4">
          {/* Question */}
          <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <h2 className="text-gray-900 text-base font-semibold leading-relaxed">{lq.q}</h2>
          </div>

          {/* Answers */}
          <AnswerButton answers={shuf.a} correctIndex={shuf.correct} selectedIndex={lightningSel} onPick={doLightningAns} hintEliminated={[]} />

          {/* Result */}
          {answered && (
            <div className="text-center mt-3">
              <div className={`text-lg font-black ${wasCorrect ? 'text-green-600' : 'text-red-500'}`}>
                {wasCorrect ? 'Correct! +50 pts' : `Wrong — ${shuf.a[shuf.correct]}`}
              </div>
              <button onClick={nextLightning} className="btn-primary mt-3 px-8">
                {isLast ? 'Start Your Trip!' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- GAME OVER ----
  if (phase === 'game_over') {
    const stars = getStarRating(points);
    const starStr = Array(5).fill(0).map((_, i) => i < stars ? '★' : '☆').join(' ');
    const tripTime = formatTripTime(tripMinutes);
    const regionsVisited: string[] = [];
    visited.forEach(nid => {
      EDGES.filter(e => e.from === nid || e.to === nid).forEach(e => {
        if (!regionsVisited.includes(e.region)) regionsVisited.push(e.region);
      });
    });
    const perfectCount = perfectCities.size;
    const completedCount = masteredCities.length - perfectCount;

    return (
      <div className="min-h-screen game-bg-coastal pb-10">
        <LocationHeader size="full" label="END OF THE TRAIL" title="SANTA MONICA" subtitle="California"
          detail="The Pacific. The pier. 2,448 miles from where you started."
          scene="coastal" imageSrc={img(getCityImage('Santa Monica', 'CA'))} />

        <div className="px-4 pt-4">
          {/* Celebration */}
          <div className="text-center mb-4">
            <div className="text-3xl text-amber-500 mb-1">{starStr}</div>
            <div className="text-gray-900 text-xl font-bold">You made it.</div>
            <div className="text-gray-500 text-sm mt-1">Chicago to Santa Monica on Route 66.</div>
          </div>

          {/* Trip summary card — the screenshot-worthy moment */}
          <div className="card p-4 mb-4 border-amber-200 bg-amber-50/50">
            <div className="text-amber-600 font-mono text-[8px] tracking-widest text-center mb-3">YOUR ROAD TRIP</div>
            <div className="text-center mb-3">
              <div className="text-gray-900 text-2xl font-bold">{tripTime.withLife}</div>
              <div className="text-gray-500 text-xs">
                {tripTime.hours}h {tripTime.minutes}m driving &middot; {postcards.length} stops &middot; {tripTime.days} night{tripTime.days > 1 ? 's' : ''}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-amber-600 text-lg font-bold">{points.toLocaleString()}</div>
                <div className="text-gray-400 text-[7px] font-mono">SCORE</div>
              </div>
              <div className="text-center">
                <div className="text-gray-900 text-lg font-bold">{miles}</div>
                <div className="text-gray-400 text-[7px] font-mono">MILES</div>
              </div>
              <div className="text-center">
                <div className="text-gray-900 text-lg font-bold">{accuracy}%</div>
                <div className="text-gray-400 text-[7px] font-mono">ACCURACY</div>
              </div>
              <div className="text-center">
                <div className="text-amber-500 text-lg font-bold">{bestStreak}</div>
                <div className="text-gray-400 text-[7px] font-mono">STREAK</div>
              </div>
            </div>
          </div>

          {/* Questions summary */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            <div className="card text-center p-2">
              <div className="text-gray-900 text-lg font-bold">{qCorr}/{qAns}</div>
              <div className="text-gray-400 text-[7px] font-mono">QUESTIONS</div>
            </div>
            <div className="card text-center p-2">
              <div className="text-green-600 text-lg font-bold">{perfectCount}</div>
              <div className="text-gray-400 text-[7px] font-mono">MASTERED</div>
            </div>
            <div className="card text-center p-2">
              <div className="text-blue-500 text-lg font-bold">{completedCount}</div>
              <div className="text-gray-400 text-[7px] font-mono">COMPLETED</div>
            </div>
          </div>

          {/* Journey */}
          <div className="text-gray-500 font-mono text-[9px] tracking-widest mb-1.5">YOUR JOURNEY</div>
          <div className="card p-3 mb-4">
            {visited.map((nid, i) => {
              const nd = NODES[nid];
              const isLast = i === visited.length - 1;
              const isCompleted = masteredCities.includes(nid);
              const isPerfect = perfectCities.has(nid);
              return (
                <div key={i} className={`flex items-center gap-2 py-1.5 ${!isLast ? 'border-b border-gray-100' : ''}`}>
                  {isPerfect ? (
                    <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#059669" /><polyline points="5,8 7,10 11,6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  ) : isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#60a5fa" /><polyline points="5,8 7,10 11,6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill={isLast ? '#10b981' : '#d4a340'} /></svg>
                  )}
                  <span className={`flex-1 text-xs ${isLast || isCompleted ? 'font-bold' : ''}`}>{nd.name}, {nd.state}</span>
                  {isPerfect && <span className="text-green-600 text-[8px] font-mono font-bold">MASTERED</span>}
                  {isCompleted && !isPerfect && <span className="text-blue-500 text-[8px] font-mono font-bold">COMPLETED</span>}
                  {isLast && !isCompleted && <span className="text-green-500 text-[9px] font-mono">FINISH</span>}
                </div>
              );
            })}
          </div>

          {/* Postcards */}
          {postcards.length > 0 && (
            <div className="mb-4">
              <div className="text-gray-500 font-mono text-[9px] tracking-widest mb-1.5">POSTCARDS ({postcards.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {postcards.map((p, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                    <span className="text-amber-800 text-[11px] font-semibold">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regions */}
          {regionsVisited.length > 0 && (
            <div className="mb-4">
              <div className="text-gray-500 font-mono text-[9px] tracking-widest mb-1.5">REGIONS CROSSED ({regionsVisited.length})</div>
              <div className="flex flex-wrap gap-1">
                {regionsVisited.map((r, i) => (
                  <div key={i} className="bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                    <span className="text-gray-600 text-[10px]">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button onClick={() => { setTotalTrips(t => t + 1); setPhase('home'); }} className="btn-primary w-full">
              Back to Home
            </button>
            <button onClick={() => { clearSave(); setGameStarted(false); setTotalTrips(t => t + 1); setPhase('home'); }}
              className="w-full text-center text-gray-400 text-xs py-2">
              Start New Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
