import { db } from '@/lib/db';
import { currentYear } from '@/lib/utils';

export async function seedSampleData() {
  const existingContributors = await db.contributors.count();
  if (existingContributors > 0) return false;

  const year = currentYear();
  const names = ['Ahmed Khan', 'Fatima Noor', 'Yusuf Ali', 'Sara Ibrahim', 'Imran Sheikh'];
  const contributorIds = [];
  for (const name of names) {
    const id = await db.contributors.add({ name, createdAt: new Date().toISOString() });
    contributorIds.push(id);
  }

  const methods = ['Cash', 'Bank Transfer', 'UPI'];
  for (let m = 1; m <= 6; m++) {
    for (let i = 0; i < contributorIds.length; i++) {
      if (Math.random() < 0.25) continue; // some months skipped naturally
      const contributorId = contributorIds[i];
      const contributor = names[i];
      const amount = [100, 150, 200, 250, 300][Math.floor(Math.random() * 5)];
      const day = String(3 + ((i * 4) % 24)).padStart(2, '0');
      const collectionId = await db.collections.add({
        contributorId,
        contributorName: contributor,
        amount,
        paymentDate: `${year}-${String(m).padStart(2, '0')}-${day}`,
        paymentTime: '10:00',
        paymentMethod: methods[i % methods.length],
        notes: '',
        createdAt: new Date().toISOString()
      });
      await db.collectionMonths.add({ collectionId, month: m, year });
    }
  }

  for (let m = 1; m <= 5; m++) {
    const day = String(20 + (m % 6)).padStart(2, '0');
    await db.transfers.add({
      amount: 700 + m * 20,
      transferDate: `${year}-${String(m).padStart(2, '0')}-${day}`,
      transferTime: '15:00',
      method: 'Bank Transfer',
      notes: `Monthly transfer for month ${m}`,
      createdAt: new Date().toISOString()
    });
  }

  return true;
}
