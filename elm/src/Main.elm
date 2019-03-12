module Main exposing (main)

import Browser
import Html exposing (Html)
import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Decode.Pipeline as Pipeline
import Time


type alias Flags =
    {}


type alias Model =
    { vehicles : List Vehicle
    , stops : List Stop
    }


type Msg
    = ReceiveVehicles (Result Http.Error (List Vehicle))
    | Poll Time.Posix
    | ReceiveStops (Result Http.Error (List Stop))


type alias Stop =
    { id : String
    , name : String
    }


type alias Vehicle =
    { label : String
    , route : String
    , currentStatus : CurrentStatus
    , stationId : String
    , newFlag : Bool
    }


type CurrentStatus
    = InTransitTo
    | StoppedAt


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
    ( { vehicles = []
      , stops = []
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
        , expect = Http.expectJson ReceiveVehicles (Decode.list vehicleDecoder)
        }


getStops : Cmd Msg
getStops =
    Http.get
        { url = "/stops/Orange"
        , expect = Http.expectJson ReceiveStops (Decode.list stopDecoder)
        }


vehicleDecoder : Decoder Vehicle
vehicleDecoder =
    Decode.succeed Vehicle
        |> Pipeline.required "label" Decode.string
        |> Pipeline.required "route" Decode.string
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
            case result of
                Ok vehicles ->
                    ( { model | vehicles = vehicles }
                    , Cmd.none
                    )

                Err e ->
                    let
                        _ =
                            Debug.log "" e
                    in
                    ( model
                    , Cmd.none
                    )

        ReceiveStops result ->
            case result of
                Ok stops ->
                    ( { model | stops = stops }
                    , Cmd.none
                    )

                Err e ->
                    let
                        _ =
                            Debug.log "" e
                    in
                    ( model
                    , Cmd.none
                    )

        Poll _ ->
            ( model
            , getNewVehicles
            )


view : Model -> Html Msg
view model =
    Html.div []
        [ Html.text "Stops:"
        , Html.ul []
            (List.map renderStop model.stops)
        , Html.text "Vehicles:"
        , Html.ul []
            (List.map renderVehicle model.vehicles)
        ]


renderStop : Stop -> Html Msg
renderStop stop =
    Html.li []
        [ Html.text (Debug.toString stop)
        ]


renderVehicle : Vehicle -> Html Msg
renderVehicle vehicle =
    Html.li []
        [ Html.text (Debug.toString vehicle)
        ]
