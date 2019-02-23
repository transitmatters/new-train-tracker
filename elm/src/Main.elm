module Main exposing (main)

import Browser
import Html exposing (Html)


main =
    Browser.sandbox
        { init = { vehicles = [] }
        , view = view
        , update = update
        }


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
    = NoOp


update : Msg -> Model -> Model
update msg model =
    model


view : Model -> Html Msg
view model =
    Html.text "Hello world"
