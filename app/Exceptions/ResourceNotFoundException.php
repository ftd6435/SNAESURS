<?php

namespace App\Exceptions;

use Exception;

class ResourceNotFoundException extends Exception
{
    protected $message = 'Ressource introuvable.';
    protected $code = 404;

    public function render()
    {
        return response()->json([
            'status' => 0,
            'message' => $this->message,
            'error' => []
        ], $this->code);
    }
}
