<?php

namespace App\Exceptions;

use Exception;

class UnauthorizedException extends Exception
{
    protected $message = 'Accès non autorisé.';
    protected $code = 403;

    public function render()
    {
        return response()->json([
            'status' => 0,
            'message' => $this->message,
            'error' => []
        ], $this->code);
    }
}
