/**
 * ДЕМО-ФАЙЛ С ТИПИЧНЫМИ ПРОБЛЕМАМИ.
 *
 * Это учебный пример плохого кода: здесь намеренно собраны дубли,
 * мёртвый код, магические числа и захардкоженный токен.
 * Реальных ключей здесь нет — токен выдуманный, только для демонстрации.
 */

/**
 * Токен приходит из переменной окружения, в коде секретов нет.
 * Значение-заглушка лежит в demo/.env.example, реальный — в demo/.env (в git не попадает).
 * Запуск с токеном: node --env-file=demo/.env demo/bad_code.js
 */
const API_TOKEN = process.env.API_TOKEN;
const API_URL = "https://api.example.com/v1/charge";

/* Правила тарификации. Меняются в одном месте, а не по всему файлу. */
const CARD_DISCOUNT_RATE = 0.1;
const CASH_DISCOUNT_RATE = 0.15;
const TAX_RATE = 0.2;
/** Деньги округляем до копеек: результат целых центов. */
const MONEY_SCALE = 100;
/** Таймаут запроса к платёжному API, мс. */
const REQUEST_TIMEOUT_MS = 3000;

/** Итог по оплате картой: скидка 10% и налог 20% поверх. */
function calcTotalCard(price, qty) {
  const subtotal = price * qty;
  const discount = subtotal * CARD_DISCOUNT_RATE;
  const total = (subtotal - discount) * (1 + TAX_RATE);
  return Math.round(total * MONEY_SCALE) / MONEY_SCALE;
}

/** Итог по оплате наличными: скидка 15% и налога нет. Отличается от карты только числами. */
function calcTotalCash(price, qty) {
  const subtotal = price * qty;
  const discount = subtotal * CASH_DISCOUNT_RATE;
  const total = subtotal - discount;
  return Math.round(total * MONEY_SCALE) / MONEY_SCALE;
}

/** Старая версия расчёта НДС. На неё больше не перешли, вызовов в проекте нет. */
function calcLegacyVat(amount) {
  return amount * 0.18;
}

async function chargeCard(price, qty) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: price, quantity: qty }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return res.json();
}

// Демо-вызовы: печатаем результат, чтобы сравнить поведение до и после рефакторинга.
const price = 1250;
const qty = 3;
console.log("Картой:", calcTotalCard(price, qty));
console.log("Наличными:", calcTotalCash(price, qty));

module.exports = { calcTotalCard, calcTotalCash, chargeCard };
