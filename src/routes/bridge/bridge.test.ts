import { expect, test } from '@playwright/test'

test('bridge: select source and destination chain, enter amount and address', async ({ page }) => {
  await page.goto('/bridge')
  await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' }))
    .toBeVisible({ timeout: 15_000 })
  await page.getByText('Loading networks…').waitFor({
    state: 'hidden',
    timeout: 10_000,
  })
  await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
    timeout: 5_000,
  })
  await page.getByLabel('From chain').click()
  await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('option', { name: 'Ethereum' }).waitFor({
    state: 'visible',
    timeout: 5_000,
  })
  await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
  await page.getByLabel('To chain').click()
  await page.getByRole('option', { name: 'OP Mainnet' }).waitFor({
    state: 'visible',
    timeout: 5_000,
  })
  await page.getByRole('option', { name: 'OP Mainnet' }).click({ force: true })
  await page.getByLabel('Amount (smallest units)').fill('1000000')
  await page.getByLabel('From address').fill(
    '0x0000000000000000000000000000000000000001',
  )
})

test('bridge: click Get Quote, wait for result, assert quote result visible', async ({ page }) => {
  await page.goto('/bridge')
  await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' }))
    .toBeVisible({ timeout: 15_000 })
  await page.getByText('Loading networks…').waitFor({
    state: 'hidden',
    timeout: 10_000,
  })
  await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
    timeout: 5_000,
  })
  await page.getByLabel('From chain').click()
  await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
  await page.getByRole('option', { name: 'Ethereum' }).waitFor({
    state: 'visible',
    timeout: 5_000,
  })
  await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
  await page.getByLabel('To chain').click()
  await page.getByRole('option', { name: 'OP Mainnet' }).waitFor({
    state: 'visible',
    timeout: 5_000,
  })
  await page.getByRole('option', { name: 'OP Mainnet' }).click({ force: true })
  await page.getByLabel('Amount (smallest units)').fill('1000000')
  await page.getByLabel('From address').fill(
    '0x0000000000000000000000000000000000000001',
  )
  await page.getByRole('button', { name: 'Get Quote' }).click()
  await expect(page.locator('[data-testid="quote-result"]')).toBeVisible({
    timeout: 15_000,
  })
})
