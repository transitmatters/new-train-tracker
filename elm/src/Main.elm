module Main exposing (main)

import Browser
import Data exposing (..)
import Html exposing (Html)
import Html.Attributes as Html
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



-- View


view : Model -> Html Msg
view model =
    Html.div
        []
        [ header
        , banner
        , viewLadder model
        , footer model.vehicles
        ]


header : Html msg
header =
    Html.header
        [ Html.class "header" ]
        [ Html.img
            [ Html.class "header-logo"
            , Html.src "/assets/TM_logo.svg"
            , Html.alt "Transit Matters"
            ]
            []
        , Html.h1 [] [ Html.text "New Train Tracker" ]
        ]


banner : Html msg
banner =
    Html.div
        [ Html.class "banner" ]
        [ Html.h2 [] [ Html.text "Orange Line" ]
        ]


viewLadder : Model -> Html Msg
viewLadder model =
    Html.div
        [ Html.class "ladder" ]
        (case ( model.stops, model.vehicles ) of
            ( RemoteData.Success stops, RemoteData.Success vehicles ) ->
                List.map viewLadderRow (Ladder.ladder stops vehicles)

            ( RemoteData.Loading, _ ) ->
                [ Html.text "Loading" ]

            ( _, RemoteData.Loading ) ->
                [ Html.text "Loading" ]

            ( error_stops, error_vehicles ) ->
                [ Html.text "Error"
                , Html.text "Stops:"
                , Html.text (Debug.toString error_stops)
                , Html.text "Vehicles:"
                , Html.text (Debug.toString error_vehicles)
                ]
        )


viewLadderRow : Ladder.LadderRow -> Html msg
viewLadderRow row =
    Html.div
        [ Html.class "ladder-row" ]
        [ row.leftTrains
            |> List.head
            |> viewTrain
        , case row.stopName of
            Nothing ->
                Html.div
                    [ Html.class "track track--between" ]
                    []

            Just _ ->
                Html.div
                    [ Html.class "track track--station" ]
                    []
        , row.rightTrains
            |> List.head
            |> viewTrain
        , case row.stopName of
            Nothing ->
                emptyHtml

            Just name ->
                Html.div
                    [ Html.class "station-name" ]
                    [ Html.text name ]
        ]


viewTrain : Maybe Vehicle -> Html msg
viewTrain maybeVehicle =
    Html.div
        [ Html.class "train" ]
        (case maybeVehicle of
            Nothing ->
                []

            Just vehicle ->
                case vehicle.direction of
                    Upward ->
                        [ Html.div [ Html.class "train-arrow train-arrow-up" ] []
                        , Html.img
                            [ Html.class "train-upward train-svg"
                            , Html.src "/assets/train.svg"
                            , Html.alt "Northbound Orange Line train"
                            ]
                            []
                        , Html.text vehicle.label
                        ]

                    Downward ->
                        [ Html.text vehicle.label
                        , Html.img
                            [ Html.class "train-svg"
                            , Html.src "/assets/train.svg"
                            , Html.alt "Southbound Orange Line train"
                            ]
                            []
                        , Html.div [ Html.class "train-arrow train-arrow-down" ] []
                        ]
        )


footer : WebData (List Vehicle) -> Html msg
footer remoteVehicles =
    let
        numNewTrainsText =
            case remoteVehicles of
                RemoteData.Success vehicles ->
                    let
                        numNewTrains =
                            vehicles
                                |> List.filter .newFlag
                                |> List.length

                        trainsPlural =
                            if numNewTrains == 1 then
                                ""

                            else
                                "s"
                    in
                    String.concat
                        [ String.fromInt numNewTrains
                        , " new train"
                        , trainsPlural
                        , " in service"
                        ]

                _ ->
                    ""
    in
    Html.div
        [ Html.class "footer" ]
        [ Html.text numNewTrainsText
        , Html.img
            [ Html.class "footer-wordmark"
            , Html.src "/assets/TM_wordmark.svg"
            , Html.alt "Transit Matters"
            ]
            []
        ]


emptyHtml : Html msg
emptyHtml =
    Html.text ""
