import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatYen } from './utils'

// アプリで使う Chart.js の部品をここでまとめて登録
// （グラフを使う画面はこのファイルを import するだけでよい）
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
)

// 棒グラフの色（テーマのティール）
export const BAR_COLOR = '#0f766e'

// 棒グラフのデータ（日別・月別で共通の見た目）
export function makeBarData(labels, values) {
  return {
    labels,
    datasets: [{ data: values, backgroundColor: BAR_COLOR, borderRadius: 4 }],
  }
}

// 棒グラフの設定。onClick を渡すと棒タップ時の動作を追加できる
export function makeBarOptions(onClick) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatYen(ctx.parsed.y) } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => '¥' + v } } },
  }
  if (onClick) options.onClick = onClick
  return options
}

// ドーナツグラフのデータ（totalsByCategory の結果をそのまま渡す）
export function makeDonutData(byCat) {
  return {
    labels: byCat.map((x) => x.c.name),
    datasets: [
      {
        data: byCat.map((x) => x.total),
        backgroundColor: byCat.map((x) => x.c.color),
        borderWidth: 0,
      },
    ],
  }
}

// ドーナツグラフの設定
export function makeDonutOptions({ cutout, showLegend = true } = {}) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: showLegend ? { position: 'bottom' } : { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${formatYen(ctx.parsed)}` },
      },
    },
  }
  if (cutout) options.cutout = cutout
  return options
}
