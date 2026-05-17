<?php

namespace App\Traits;

trait ApiResponses
{
    public function successResponse($data = [], $message = null, $code = 200)
    {
        return response()->json([
            'status' => 1,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function errorResponse($message = null, $errorMessage = [], $code = 404)
    {
        return response()->json([
            'status' => 0,
            'message' => $message,
            'error' => $errorMessage
        ], $code);
    }

    public function successResponseWithToken($data = [], $token = null, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 1,
            'data' => $data,
            'token' => $token,
            'message' => $message,
        ], $code);
    }

    public function noContentSuccessResponse($message = null, $code = 203)
    {
        return response()->json([
            'status' => 1,
            'message' => $message,
        ], $code);
    }
}
