<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait ImageUpload
{
    public function imageUpload($image, $path = null)
    {
        $imageName = Str::uuid() . '.' . $image->getClientOriginalExtension();
        $fullPath = 'images/' . $path;

        Storage::disk('public')->putFileAs($fullPath, $image, $imageName);
        return $imageName;
    }

    public function fileUpload($file, $path = null)
    {
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();

        $fullPath = 'files/' . $path;

        Storage::disk('public')->putFileAs($fullPath, $file, $fileName);

        return $fileName;
    }

    public function deleteImage($image, $path = null)
    {
        $fullPath = 'images/' . $path;

        if (Storage::disk('public')->exists($fullPath . $image)) {
            Storage::disk('public')->delete($fullPath . $image);
        }
    }

    public function deleteFile($file, $path = null)
    {
        $fullPath = 'files/' . $path;

        if (Storage::disk('public')->exists($fullPath . $file)) {
            Storage::disk('public')->delete($fullPath . $file);
        }
    }
}
