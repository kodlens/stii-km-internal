<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->text('title')->nullable();
            $table->text('slug')->nullable();
            $table->mediumText('content')->nullable();
            $table->mediumText('content_text')->nullable();
            $table->enum('status', ['save', 'draft', 'submit', 'publish', 'archive'])->default('draft');
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->tinyInteger('is_publish')->default(0);
            $table->tinyInteger('is_trash')->default(0);
            $table->string('uploaded_file')->nullable();
            $table->string('original_filename')->nullable();
            $table->integer('access_level')->default(0);

            $table->unsignedBigInteger('encoded_by_id')->default(0);
            $table->unsignedBigInteger('updated_by_id')->default(0);
            $table->tinyInteger('is_ojt')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
