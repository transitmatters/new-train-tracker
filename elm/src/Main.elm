module Main exposing (main)

import Browser
import Html exposing (Html)


main : Program Flags Model Msg
main =
    Browser.element
        { init =
            \_ ->
                ( { vehicles = vehicles
                  }
                , Cmd.none
                )
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        }


type alias Flags =
    {}


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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    ( model
    , Cmd.none
    )


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
