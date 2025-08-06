# 🏦 Bank App Backend

Bu proje, bir sanal bankacılık uygulamasının Node.js ve Express.js ile yazılmış **backend (sunucu)** tarafını içerir. Kullanıcılar hesap oluşturabilir, para yatırabilir/çekebilir, başka hesaplara transfer yapabilir ve işlem geçmişini görüntüleyebilir. Veritabanı olarak **SQL Server** kullanılmaktadır ve ORM olarak **Prisma** tercih edilmiştir.

## 🚀 Özellikler

- Kullanıcı kayıt ve giriş (JWT ile doğrulama)
- Kullanıcı bilgileri güncelleme
- Banka hesabı oluşturma
- Para yatırma, çekme ve transfer
- İşlem geçmişini görüntüleme
- Winston ile loglama
- Orta seviye güvenlik (bcrypt, dotenv, validation)

## 🛠️ Kullanılan Teknolojiler

- Node.js
- Express.js
- Prisma ORM
- SQL Server
- JWT (jsonwebtoken)
- Bcrypt
- Cors
- Dotenv
- Morgan & Winston (loglama)
- Nodemon (geliştirme ortamı)

## 📁 Kurulum

1. Node.js Kurulumu:
    - https://nodejs.org/tr/download adresinden kullandığınız platforma göre bilgisayarınıza indirin ve kurun.

2. SQL Server Kurulumu:
    - https://www.microsoft.com/tr-tr/sql-server/sql-server-downloads adresinden SQL Server indirin ve kurulumunu gerçekleştirin.
    - Veritabanı arayüzü için https://learn.microsoft.com/en-us/ssms/install/install adresinden SQL Server Managment Studio indirin.
    - SSMS içerisinde sunucuya bağlandıktan sonra kullanacağımız veritabanı için `Veritabanları -> Yeni Veritabanı` şeklinde takip ederek bir veritabanı oluşturun.

3. Repoyu klonla:
   ```
   git clone https://github.com/tolgadirek/bank_app_backend.git
   cd bank_app_backend
   ```

4. Bağımlılıkları yükle:
   ```
   npm install
   ```

## ⚙️ .env Dosyası

Proje dizinine `.env` dosyası oluşturun:

```
PORT=5000
SECRET_TOKEN=senin-gizli-jwt-anahtarın
DATABASE_URL="sqlserver://localhost:1433;database=DatabaseName;user=SunucuUserName;password=Parola;encrypt=true;trustServerCertificate=true"
```

## 🔧 Prisma Kullanımı

Veritabanına tablo göndermek için şu komutları kullan:

```
npx prisma migrate dev --name connection
npx prisma generate
```

## 🧪 Projeyi Çalıştırma

Geliştirme ortamı (otomatik yeniden başlatma):

```
npm run dev
```
