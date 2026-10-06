import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@tradecore.local';
  
  // Ensure the SUPER_ADMIN role exists
  let adminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator',
      },
    });
    console.log('Created SUPER_ADMIN role');
  }

  // Create or Update Admin user
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        roles: {
          create: {
            roleId: adminRole.id
          }
        }
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        passwordHash,
        roles: {
          upsert: {
            where: {
              userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id
              }
            },
            create: { roleId: adminRole.id },
            update: {}
          }
        }
      },
    });
    console.log(`Updated admin user: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
