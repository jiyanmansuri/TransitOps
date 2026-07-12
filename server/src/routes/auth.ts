import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken, verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return res.status(423).json({ error: `Account locked. Try again in ${mins} minute(s).` });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const lockout = newAttempts >= LOCKOUT_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: lockout ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });
    if (lockout) {
      return res.status(423).json({ error: 'Account locked after 5 failed attempts. Try again in 15 minutes.' });
    }
    return res.status(401).json({ error: `Invalid credentials. ${LOCKOUT_ATTEMPTS - newAttempts} attempt(s) remaining.` });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const token = signToken({ userId: user.id, role, name: user.name, email: user.email });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role } });
});

router.get('/me', verifyToken, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

export default router;
