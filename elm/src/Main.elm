module Main exposing (main)

import Browser
import Data exposing (..)
import Html exposing (Html)
import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Decode.Pipeline as Pipeline
import Ladder
import RemoteData exposing (WebData)
import Time


type alias Flags =
    {}


type alias Model =
    { vehicles : WebData (List Vehicle)
    , stops : WebData (List Stop)
    }


type Msg
    = ReceiveVehicles (WebData (List Vehicle))
    | Poll Time.Posix
    | ReceiveStops (WebData (List Stop))


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


init : flags -> ( Model, Cmd Msg )
init _ =
    ( { vehicles = RemoteData.Loading
      , stops = RemoteData.Loading
      }
    , Cmd.batch
        [ getNewVehicles
        , getStops
        ]
    )


subscriptions : Model -> Sub Msg
subscriptions model =
    Time.every 30000 Poll


getNewVehicles : Cmd Msg
getNewVehicles =
    Http.get
        { url = "/data/Orange"
        , expect =
            Http.expectJson
                (ReceiveVehicles << RemoteData.fromResult)
                (Decode.list vehicleDecoder)
        }


getStops : Cmd Msg
getStops =
    Http.get
        { url = "/stops/Orange"
        , expect =
            Http.expectJson
                (ReceiveStops << RemoteData.fromResult)
                (Decode.list stopDecoder)
        }


vehicleDecoder : Decoder Vehicle
vehicleDecoder =
    Decode.succeed Vehicle
        |> Pipeline.required "label" Decode.string
        |> Pipeline.required "route" Decode.string
        |> Pipeline.required "direction"
            (Decode.int
                |> Decode.andThen
                    (\i ->
                        case i of
                            0 ->
                                Decode.succeed Downward

                            1 ->
                                Decode.succeed Upward

                            _ ->
                                Decode.fail ("Unexpected direction " ++ String.fromInt i)
                    )
            )
        |> Pipeline.required "current_status"
            (Decode.string
                |> Decode.andThen
                    (\s ->
                        case s of
                            "IN_TRANSIT_TO" ->
                                Decode.succeed InTransitTo

                            "INCOMING_AT" ->
                                Decode.succeed InTransitTo

                            "STOPPED_AT" ->
                                Decode.succeed StoppedAt

                            _ ->
                                Decode.fail ("Unexpected current_status: " ++ s)
                    )
            )
        |> Pipeline.required "station_id" Decode.string
        |> Pipeline.required "new_flag" Decode.bool


stopDecoder : Decoder Stop
stopDecoder =
    Decode.succeed Stop
        |> Pipeline.required "id" Decode.string
        |> Pipeline.required "name" Decode.string


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ReceiveVehicles result ->
            ( { model
                | vehicles = result
              }
            , Cmd.none
            )

        ReceiveStops result ->
            ( { model
                | stops = result
              }
            , Cmd.none
            )

        Poll _ ->
            ( model
            , getNewVehicles
            )


view : Model -> Html Msg
view model =
    case ( model.stops, model.vehicles ) of
        ( RemoteData.Success stops, RemoteData.Success vehicles ) ->
            viewLadder stops vehicles

        ( RemoteData.Loading, _ ) ->
            Html.text "Loading"

        ( _, RemoteData.Loading ) ->
            Html.text "Loading"

        ( error_stops, error_vehicles ) ->
            Html.div []
                [ Html.text "Error"
                , Html.text "Stops:"
                , Html.text (Debug.toString error_stops)
                , Html.text "Vehicles:"
                , Html.text (Debug.toString error_vehicles)
                ]


viewLadder : List Stop -> List Vehicle -> Html Msg
viewLadder stops vehicles =
    let
        ladder =
            Ladder.ladder stops vehicles
    in
    Html.div []
        (List.map viewLadderRow ladder)


viewLadderRow : Ladder.LadderRow -> Html msg
viewLadderRow row =
    Html.div []
        [ Html.text
            (case row.leftTrains of
                _ :: _ ->
                    "X"

                [] ->
                    "."
            )
        , Html.text
            (case row.stopName of
                Nothing ->
                    "|"

                Just _ ->
                    "O"
            )
        , Html.text
            (case row.rightTrains of
                _ :: _ ->
                    "X"

                [] ->
                    "."
            )
        , Html.text
            (case row.stopName of
                Nothing ->
                    "."

                Just name ->
                    name
            )
        ]
