# Migration Guide

## ✅ Migration Oluşturuldu

İlk migration dosyası oluşturuldu: `prisma/migrations/0_init/migration.sql`

Bu migration şu tabloları oluşturur:
- `User` - Kullanıcı bilgileri
- `Authenticator` - WebAuthn authenticator bilgileri

## 🚀 Migration'ı Çalıştırma

### Local Development (Neon, Supabase, vs.)

1. **DATABASE_URL'i ayarlayın** (`.env` veya `.env.local`):
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

2. **Migration'ı uygulayın:**
```bash
npm run db:migrate:deploy
```

veya

```bash
npx prisma migrate deploy
```

### Vercel Deployment

Migration'lar otomatik olarak çalışacak çünkü `vercel.json`'da şu komut var:
```json
"buildCommand": "npx prisma generate && npx prisma migrate deploy && next build"
```

## 📋 Migration İçeriği

Migration şu işlemleri yapar:

1. **User tablosu oluşturur:**
   - `id` (TEXT, PRIMARY KEY)
   - `email` (TEXT, UNIQUE)
   - `password` (TEXT, nullable)
   - `createdAt` (TIMESTAMP)
   - `updatedAt` (TIMESTAMP)

2. **Authenticator tablosu oluşturur:**
   - `credentialID` (TEXT, PRIMARY KEY)
   - `credentialPublicKey` (BYTEA)
   - `counter` (BIGINT)
   - `credentialDeviceType` (TEXT)
   - `credentialBackedUp` (BOOLEAN)
   - `transports` (TEXT, nullable)
   - `userId` (TEXT, FOREIGN KEY)

3. **Index'ler oluşturur:**
   - `User.email` için UNIQUE index
   - `Authenticator.userId` için index

4. **Foreign Key oluşturur:**
   - `Authenticator.userId` → `User.id` (CASCADE DELETE)

## 🔍 Migration Durumunu Kontrol Etme

```bash
npx prisma migrate status
```

## 🗑️ Migration'ı Geri Alma (Reset)

⚠️ **DİKKAT:** Bu işlem tüm verileri siler!

```bash
npm run db:reset
```

## 📝 Yeni Migration Oluşturma

Schema'yı değiştirdikten sonra:

```bash
npm run db:migrate
```

Bu komut:
1. Yeni migration dosyası oluşturur
2. Migration'ı veritabanına uygular
3. Prisma Client'ı yeniden generate eder

