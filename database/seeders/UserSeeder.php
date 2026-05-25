<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $data = [
            [
                'username' => 'admin',
                'lname' => 'Amparado',
                'fname' => 'Etienne',
                'mname' => 'N',
                'sex' => 'MALE',
                'role'=> 'admin',
                'password' => Hash::make('a')
            ],
            [
                'username' => 'encoder',
                'lname' => 'Amparado',
                'fname' => 'Etienne',
                'mname' => 'N',
                'sex' => 'MALE',
                'role'=> 'encoder',
                'password' => Hash::make('a')
            ]
        ];

        User::insertOrIgnore($data);
    }
}
