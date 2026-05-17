<?php

namespace App\Exceptions;

use Exception;

class BusinessException extends Exception
{
    protected $code = 422;

    public function __construct(string $message = 'Opération invalide.', int $code = 422)
    {
        parent::__construct($message, $code);
    }

    public function render()
    {
        return response()->json([
            'status' => 0,
            'message' => $this->message,
            'error' => []
        ], $this->code);
    }
}
