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
                        [ ( Upward, StoppedAt, "A" )
                        , ( Upward, InTransitTo, "A" )
                        , ( Downward, StoppedAt, "B" )
                        , ( Downward, InTransitTo, "C" )
                        ]
                            |> List.map
                                (\( direction, status, station ) ->
                                    { label = "label"
                                    , route = "route"
                                    , direction = direction
                                    , currentStatus = status
                                    , stationId = station
                                    , newFlag = False
                                    }
                                )

                    expected =
                        [ ( False, True, Just "A" )
                        , ( False, True, Nothing )
                        , ( True, False, Just "B" )
                        , ( True, False, Nothing )
                        , ( False, False, Just "C" )
                        , ( False, False, Nothing )
                        , ( False, False, Just "D" )
                        ]
                            |> List.map
                                (\( left, right, name ) ->
                                    { leftTrain = left
                                    , rightTrain = right
                                    , stopName = name
                                    }
                                )

                    actual =
                        Ladder.ladder stops vehicles
                in
                Expect.equal actual expected
        ]
