module Main exposing (main)

import Browser
import Html exposing (Html)


main =
    Browser.sandbox
        { init = { vehicles = vehicles }
        , view = view
        , update = update
        }


vehicles : List Vehicle
vehicles =
    [ { label = "1241"
      , route = "Orange"
      , currentStatus = StoppedAt
      , stationId = "place-ogmnl"
      , newFlag = False
      }
    ]


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


renderVehicle : Vehicle -> Html Msg
renderVehicle vehicle =
    Html.text (Debug.toString vehicle)


view : Model -> Html Msg
view model =
    Html.div []
        [ Html.text "Vehicles:"
        , Html.ul []
            (List.map renderVehicle model.vehicles)
        ]
