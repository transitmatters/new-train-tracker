module Main exposing (main)

import Browser
import Html exposing (Html)


main =
    Browser.sandbox
        { init = {}
        , view = view
        , update = update
        }


type alias Model =
    {}


type Msg
    = NoOp


update : Msg -> Model -> Model
update msg model =
    model


view : Model -> Html Msg
view model =
    Html.text "Hello world"
