module Helpers exposing (robustListDecoder)

import Json.Decode as Decode exposing (Decoder)


{-| Discards any elements that fail to decode.
-}
robustListDecoder : Decoder a -> Decoder (List a)
robustListDecoder elemDecoder =
    Decode.value
        -- Decoder Decode.Value
        |> Decode.map (Decode.decodeValue elemDecoder)
        -- Decoder (Result x a)
        |> Decode.map Result.toMaybe
        -- Decoder (Maybe a)
        |> Decode.list
        -- Decoder (List (Maybe a))
        |> Decode.map (List.filterMap identity)
