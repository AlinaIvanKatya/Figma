import { resizeRect } from '../src/utils/geometry.ts';

/**
 * Проверка resizeRect: чистая математика ресайза за маркер рамки.
 *
 * Запуск из mini-figma:
 *     node scripts/resize-rect.test.mjs
 *
 * Фреймворка в проекте нет, поэтому скрипт самодостаточен: падает с ненулевым
 * кодом при первой же неудаче. Импортирует НАСТОЯЩИЙ src/utils/geometry.ts
 * (Node 22.6+ вырезает типы из .ts) — копию математики здесь намеренно нет,
 * иначе проверяли бы не тот код.
 */

const origin = { x: 100, y: 50, width: 200, height: 100 };
const LEFT = origin.x;
const RIGHT = origin.x + origin.width;
const TOP = origin.y;
const BOTTOM = origin.y + origin.height;
const CX = LEFT + origin.width / 2;
const CY = TOP + origin.height / 2;

/** Оси, которые двигает маркер: 1 — правая/нижняя, -1 — левая/верхняя, 0 — стоит. */
const AXES = {
  nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0],
  se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0],
};
const HANDLES = Object.keys(AXES);

let checks = 0;
let failures = 0;

function check(label, actual, expected, eps = 1e-6) {
  checks += 1;
  if (Math.abs(actual - expected) > eps) {
    failures += 1;
    console.error(`  ПРОВАЛ ${label}: получено ${actual}, ожидалось ${expected}`);
  }
}

const eq = (r) => JSON.stringify({
  x: +r.x.toFixed(4), y: +r.y.toFixed(4), width: +r.width.toFixed(4), height: +r.height.toFixed(4),
});

// --- 1. Якорь неподвижен, тянущаяся сторона встаёт на курсор -----------------
console.log('1. Якорь и тянущаяся сторона');
for (const handle of HANDLES) {
  const [hx, hy] = AXES[handle];
  const current = {
    x: hx === 0 ? CX : hx > 0 ? RIGHT + 37 : LEFT - 23,
    y: hy === 0 ? CY : hy > 0 ? BOTTOM + 41 : TOP - 19,
  };
  const r = resizeRect(origin, handle, current, { aspect: false, fromCenter: false });

  if (hx === 0) { check(`${handle} x`, r.x, LEFT); check(`${handle} width`, r.width, origin.width); }
  if (hx > 0) { check(`${handle} left`, r.x, LEFT); check(`${handle} right@cursor`, r.x + r.width, current.x); }
  if (hx < 0) { check(`${handle} right`, r.x + r.width, RIGHT); check(`${handle} left@cursor`, r.x, current.x); }

  if (hy === 0) { check(`${handle} y`, r.y, TOP); check(`${handle} height`, r.height, origin.height); }
  if (hy > 0) { check(`${handle} top`, r.y, TOP); check(`${handle} bottom@cursor`, r.y + r.height, current.y); }
  if (hy < 0) { check(`${handle} bottom`, r.y + r.height, BOTTOM); check(`${handle} top@cursor`, r.y, current.y); }
}

// --- 2. Перетаскивание через якорь «переворачивает» фигуру --------------------
console.log('2. Переворот через якорь');
for (const handle of HANDLES) {
  const [hx, hy] = AXES[handle];
  if (hx === 0 || hy === 0) continue; // сторона переворачивается только в своей оси
  const current = { x: LEFT - 40, y: TOP - 30 }; // сильнее левого верхнего угла
  const r = resizeRect(origin, handle, current, { aspect: false, fromCenter: false });
  // Фигура не уходит за исходную границу и не вырождается
  check(`${handle} flip min-x`, Math.min(r.x, r.x + r.width), Math.min(LEFT, current.x));
  check(`${handle} flip min-y`, Math.min(r.y, r.y + r.height), Math.min(TOP, current.y));
  if (r.width < 1 || r.height < 1) {
    failures += 1;
    console.error(`  ПРОВАЛ ${handle} flip: вырожденный прямоугольник ${eq(r)}`);
  }
  checks += 1;
}

// --- 3. Shift: пропорции ------------------------------------------------------
console.log('3. Shift — пропорции');
for (const handle of HANDLES) {
  const [hx, hy] = AXES[handle];
  const current = { x: hx === 0 ? CX : RIGHT + 100, y: hy === 0 ? CY : BOTTOM + 10 };
  const r = resizeRect(origin, handle, current, { aspect: true, fromCenter: false });
  check(`${handle} пропорция`, r.width / r.height, origin.width / origin.height, 1e-9);
}

// --- 4. Alt: центр неподвижен ------------------------------------------------
console.log('4. Alt — от центра');
for (const handle of HANDLES) {
  const [hx, hy] = AXES[handle];
  const current = { x: hx === 0 ? CX : RIGHT + 60, y: hy === 0 ? CY : BOTTOM + 30 };
  const r = resizeRect(origin, handle, current, { aspect: false, fromCenter: true });
  check(`${handle} центр x`, r.x + r.width / 2, CX);
  check(`${handle} центр y`, r.y + r.height / 2, CY);
}

// --- 5. Минимальный размер 1px ------------------------------------------------
console.log('5. Минимум 1px');
for (const handle of HANDLES) {
  const [hx, hy] = AXES[handle];
  const current = { x: hx === 0 ? CX : LEFT, y: hy === 0 ? CY : TOP };
  const r = resizeRect(origin, handle, current, { aspect: false, fromCenter: false });
  if (r.width < 1 || r.height < 1) {
    failures += 1;
    console.error(`  ПРОВАЛ ${handle} минимум: ${eq(r)}`);
  }
  checks += 1;
}

// --- 6. Линейность: зум применяется ДО вызова (screenToWorld), здесь мир ------
console.log('6. Линейность (мировые координаты)');
{
  const a = resizeRect(origin, 'se', { x: RIGHT + 10, y: BOTTOM + 10 }, { aspect: false, fromCenter: false });
  const b = resizeRect(origin, 'se', { x: RIGHT + 20, y: BOTTOM + 20 }, { aspect: false, fromCenter: false });
  check('линейность ширины', b.width - origin.width, 2 * (a.width - origin.width));
  check('линейность высоты', b.height - origin.height, 2 * (a.height - origin.height));
}

console.log(`\nПроверок: ${checks}, провалов: ${failures}`);
if (failures > 0) {
  console.error('resizeRect: проверка НЕ пройдена');
  process.exit(1);
}
console.log('resizeRect: все проверки пройдены');
