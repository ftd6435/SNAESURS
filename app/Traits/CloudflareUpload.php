<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait CloudflareUpload
{
    protected $disk = 'r2';

    public function uploadImage($image, $path = null)
    {
        $imageName = Str::uuid() . '.' . $image->getClientOriginalExtension();
        $fullPath = 'images/' . trim($path, '/') . '/';

        Storage::disk($this->disk)->putFileAs($fullPath, $image, $imageName);

        return $imageName;
    }

    public function uploadFile($file, $path = null)
    {
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $fullPath = 'files/' . trim($path, '/') . '/';

        Storage::disk($this->disk)->putFileAs($fullPath, $file, $fileName);

        return $fileName;
    }

    public function deleteImage($image, $path = null)
    {
        $fullPath = 'images/' . trim($path, '/') . '/' . $image;

        if (Storage::disk($this->disk)->exists($fullPath)) {
            Storage::disk($this->disk)->delete($fullPath);
        }
    }

    public function deleteFile($file, $path = null)
    {
        $fullPath = 'files/' . trim($path, '/') . '/' . $file;

        if (Storage::disk($this->disk)->exists($fullPath)) {
            Storage::disk($this->disk)->delete($fullPath);
        }
    }

    public function getFileUrl($file, $path = null)
    {
        $fullPath = 'files/' . trim($path, '/') . '/' . $file;
        $disk = Storage::disk($this->disk);

        // Check if temporaryUrl method exists (requires AWS S3 adapter)
        if (method_exists($disk, 'temporaryUrl')) {
            return $disk->temporaryUrl($fullPath, now()->addDays(7));
        }

        // Fallback to regular URL if temporaryUrl not available
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        return $disk->url($fullPath);
    }

    public function getImageUrl($image, $path = null)
    {
        $fullPath = 'images/' . trim($path, '/') . '/' . $image;
        $disk = Storage::disk($this->disk);

        // Check if temporaryUrl method exists (requires AWS S3 adapter)
        if (method_exists($disk, 'temporaryUrl')) {
            return $disk->temporaryUrl($fullPath, now()->addDays(7));
        }

        // Fallback to regular URL if temporaryUrl not available
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        return $disk->url($fullPath);
    }
}
