module Main exposing (main)

import Browser
import Html exposing (Html)
import Http
import Json.Decode as Decode exposing (Decoder)
import Json.Decode.Pipeline as Pipeline


main : Program Flags Model Msg
main =
    Browser.element
        { init =
            \_ ->
                ( { vehicles = []
                  }
                , getNewVehicles
                )
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        }


type alias Flags =
    {}


getNewVehicles : Cmd Msg
getNewVehicles =
    Http.get
        { url = "/data/Orange"
        , expect = Http.expectJson ReceiveVehicles (Decode.list vehicleDecoder)
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


type alias Model =
    { vehicles : List Vehicle
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


type Msg
    = ReceiveVehicles (Result Http.Error (List Vehicle))


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


renderVehicle : Vehicle -> Html Msg
renderVehicle vehicle =
    Html.li []
        [ Html.text (Debug.toString vehicle)
        ]


view : Model -> Html Msg
view model =
    Html.div []
        [ Html.text "Vehicles:"
        , Html.ul []
            (List.map renderVehicle model.vehicles)
        ]
