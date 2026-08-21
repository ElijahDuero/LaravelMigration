<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('incident_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incident_id');
            $table->enum('attachment_type', ['screenshot', 'evidence', 'log']);
            $table->string('original_filename', 255);
            $table->string('stored_filename', 255)->unique();
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('uploaded_by', 100);
            $table->dateTime('uploaded_at');

            $table->index('incident_id');
            $table->foreign('incident_id')->references('id')->on('incidents')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_attachments');
    }
};
