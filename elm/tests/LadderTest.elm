module LadderTest exposing (suite)

import Data exposing (..)
import Expect exposing (Expectation)
import Ladder
import Test exposing (..)


suite : Test
suite =
    describe "ladder"
        [ test "makes ladder" <|
            \_ ->
                {-
                     O X  A
                     | X
                   X O    B
                   X |
                     O    C
                     |
                     O    D
                -}
                let
                    stops =
                        [ "A", "B", "C", "D" ]
                            |> List.map
                                (\s ->
                                    { id = s
                                    , name = s
                                    }
                                )

                    vehicles =
                        [ vehicle Upward StoppedAt "A"
                        , vehicle Upward InTransitTo "A"
                        , vehicle Downward StoppedAt "B"
                        , vehicle Downward InTransitTo "C"
                        ]

                    expected =
                        [ ( [], [ vehicle Upward StoppedAt "A" ], Just "A" )
                        , ( [], [ vehicle Upward InTransitTo "A" ], Nothing )
                        , ( [ vehicle Downward StoppedAt "B" ], [], Just "B" )
                        , ( [ vehicle Downward InTransitTo "C" ], [], Nothing )
                        , ( [], [], Just "C" )
                        , ( [], [], Nothing )
                        , ( [], [], Just "D" )
                        ]
                            |> List.map
                                (\( left, right, name ) ->
                                    { leftTrains = left
                                    , rightTrains = right
                                    , stopName = name
                                    }
                                )

                    actual =
                        Ladder.ladder stops vehicles
                in
                Expect.equal actual expected
        ]


vehicle : Direction -> CurrentStatus -> String -> Vehicle
vehicle direction status station =
    { label = "label"
    , route = "route"
    , direction = direction
    , currentStatus = status
    , stationId = station
    , newFlag = False
    }
