<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserDirectory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'username'   => 'maria.santos',
                'name'       => 'Maria Santos',
                'email'      => 'elijahduero42@gmail.com',
                'password'   => '120653atd',
                'role_auth'  => 'super_admin',
                'role_dir'   => 'Super Admin',
                'branch'     => 'Main Office',
                'dept'       => 'Executive',
                'title'      => 'Chief Information Security Officer',
                'status'     => 'Active',
                'mfa'        => true,
                'avatar_bg'  => 'dc2626',
            ],
            [
                'username'   => 'juan.deleon',
                'name'       => 'Juan Dela Cruz',
                'email'      => 'juan.deleon@company.com',
                'password'   => 'password',
                'role_auth'  => 'admin',
                'role_dir'   => 'Admin',
                'branch'     => 'Main Office',
                'dept'       => 'IT Operations',
                'title'      => 'IT Director',
                'status'     => 'Active',
                'mfa'        => true,
                'avatar_bg'  => '4f46e5',
            ],
            [
                'username'   => 'ana.reyes',
                'name'       => 'Ana Reyes',
                'email'      => 'ana.reyes@company.com',
                'password'   => 'password',
                'role_auth'  => 'cyber_security',
                'role_dir'   => 'Cyber Security',
                'branch'     => 'Main Office',
                'dept'       => 'Security Operations',
                'title'      => 'SOC Lead Analyst',
                'status'     => 'Active',
                'mfa'        => true,
                'avatar_bg'  => '7c3aed',
            ],
            [
                'username'   => 'pedro.garcia',
                'name'       => 'Pedro Garcia',
                'email'      => 'pedro.garcia@company.com',
                'password'   => 'password',
                'role_auth'  => 'it',
                'role_dir'   => 'IT',
                'branch'     => 'Branch 01',
                'dept'       => 'Technical Support',
                'title'      => 'IT Support Specialist',
                'status'     => 'Active',
                'mfa'        => false,
                'avatar_bg'  => '2563eb',
            ],
            [
                'username'   => null,
                'name'       => 'Luis Mercado',
                'email'      => 'luis.mercado@company.com',
                'password'   => 'password',
                'role_auth'  => 'unassigned',
                'role_dir'   => 'Unassigned',
                'branch'     => '',
                'dept'       => '',
                'title'      => '',
                'status'     => 'Invited',
                'mfa'        => false,
                'avatar_bg'  => '6b7280',
            ],
            [
                'username'   => null,
                'name'       => 'Sofia Ramos',
                'email'      => 'sofia.ramos@company.com',
                'password'   => 'password',
                'role_auth'  => 'unassigned',
                'role_dir'   => 'Unassigned',
                'branch'     => '',
                'dept'       => '',
                'title'      => '',
                'status'     => 'Invited',
                'mfa'        => false,
                'avatar_bg'  => '6b7280',
            ],
        ];

        foreach ($users as $userData) {
            // Create in users table (auth)
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'username'          => $userData['username'],
                    'name'              => $userData['name'],
                    'password'          => Hash::make($userData['password']),
                    'role'              => $userData['role_auth'],
                    'email_verified_at' => $userData['status'] === 'Active' ? now() : null,
                ]
            );

            // Create in user_directory table
            UserDirectory::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'username'   => $userData['username'],
                    'name'       => $userData['name'],
                    'role'       => $userData['role_dir'],
                    'branch'     => $userData['branch'],
                    'dept'       => $userData['dept'],
                    'title'      => $userData['title'],
                    'status'     => $userData['status'],
                    'mfa'        => $userData['mfa'],
                    'avatar_bg'  => $userData['avatar_bg'],
                    'last_seen'  => $userData['status'] === 'Active' ? now()->toDateTimeString() : '-',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('✅ Default users created successfully!');
        $this->command->info('📧 Super Admin: maria.santos@company.com / password');
        $this->command->info('📧 Admin: juan.deleon@company.com / password');
        $this->command->info('📧 Cyber Security: ana.reyes@company.com / password');
        $this->command->info('📧 IT: pedro.garcia@company.com / password');
        $this->command->info('⏳ Pending: luis.mercado@company.com, sofia.ramos@company.com');
    }
}
