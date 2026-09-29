/**
 * ДЕМО-ФАЙЛ: пример плохого кода и его рефакторинга.
 *
 * Изначально здесь были дубли расчёта цены, мёртвая функция расчёта НДС,
 * магические числа и токен в исходнике. После рефакторинга осталось:
 * именованные константы, одна функция расчёта с параметрами и токен
 * из переменной окружения. Поведение расчёта не изменилось.
 *
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
/** Способ оплаты без налога. */
const NO_TAX = 0;
/** Деньги округляем до копеек: результат целых центов. */
const MONEY_SCALE = 100;
/** Таймаут запроса к платёжному API, мс. */
const REQUEST_TIMEOUT_MS = 3000;

/**
 * Итоговая цена заказа. Единственное место в проекте, где считается сумма:
 * ставка скидки и налог приходят параметрами, а не зашиты в код.
 */
function calcTotal(price, qty, discountRate, taxRate) {
  const subtotal = price * qty;
  const discounted = subtotal * (1 - discountRate);
  const total = discounted * (1 + taxRate);
  return Math.round(total * MONEY_SCALE) / MONEY_SCALE;
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
console.log("Картой:", calcTotal(price, qty, CARD_DISCOUNT_RATE, TAX_RATE));
console.log("Наличными:", calcTotal(price, qty, CASH_DISCOUNT_RATE, NO_TAX));

module.exports = { calcTotal, chargeCard };
